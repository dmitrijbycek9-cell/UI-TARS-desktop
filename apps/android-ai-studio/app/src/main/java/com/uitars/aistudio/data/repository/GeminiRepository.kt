package com.uitars.aistudio.data.repository

import com.google.gson.Gson
import com.uitars.aistudio.data.api.GeminiApiService
import com.uitars.aistudio.data.model.ChatMessage
import com.uitars.aistudio.data.model.Content
import com.uitars.aistudio.data.model.CountTokensRequest
import com.uitars.aistudio.data.model.GeminiError
import com.uitars.aistudio.data.model.GeminiModel
import com.uitars.aistudio.data.model.GeminiRequest
import com.uitars.aistudio.data.model.GeminiResponse
import com.uitars.aistudio.data.model.GenerationConfig
import com.uitars.aistudio.data.model.InlineData
import com.uitars.aistudio.data.model.MessageRole
import com.uitars.aistudio.data.model.ModelParameters
import com.uitars.aistudio.data.model.Part
import com.uitars.aistudio.data.model.Tool
import com.uitars.aistudio.data.model.TokenUsage
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import okhttp3.ResponseBody
import javax.inject.Inject
import javax.inject.Singleton

sealed class GeminiResult {
    data class Success(val text: String, val tokenUsage: TokenUsage) : GeminiResult()
    data class StreamChunk(val text: String) : GeminiResult()
    data class StreamComplete(val tokenUsage: TokenUsage) : GeminiResult()
    data class Error(val message: String, val code: Int = -1) : GeminiResult()
}

@Singleton
class GeminiRepository @Inject constructor(
    private val apiService: GeminiApiService,
    private val gson: Gson
) {

    suspend fun generateContent(
        apiKey: String,
        modelId: String,
        messages: List<ChatMessage>,
        systemInstruction: String?,
        parameters: ModelParameters,
        tools: List<Tool>? = null
    ): GeminiResult {
        return try {
            val contents = messages
                .filter { !it.isLoading && !it.isError }
                .map { message ->
                    val parts = mutableListOf<Part>()
                    if (message.imageBase64 != null && message.imageMimeType != null) {
                        parts.add(Part(inlineData = InlineData(message.imageMimeType, message.imageBase64)))
                    }
                    if (message.text.isNotEmpty()) {
                        parts.add(Part(text = message.text))
                    }
                    Content(
                        role = if (message.role == MessageRole.USER) "user" else "model",
                        parts = parts.ifEmpty { listOf(Part(text = "")) }
                    )
                }

            val sysInstruction = if (!systemInstruction.isNullOrBlank()) {
                Content(role = "user", parts = listOf(Part(text = systemInstruction)))
            } else null

            val request = GeminiRequest(
                contents = contents,
                systemInstruction = sysInstruction,
                generationConfig = GenerationConfig(
                    temperature = parameters.temperature,
                    topP = parameters.topP,
                    topK = parameters.topK,
                    maxOutputTokens = parameters.maxOutputTokens,
                    stopSequences = parameters.stopSequences.ifEmpty { null }
                ),
                tools = tools
            )

            val response = apiService.generateContent(modelId, apiKey, request)
            if (response.isSuccessful) {
                val body = response.body()
                val text = body?.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: ""
                val usage = body?.usageMetadata
                GeminiResult.Success(
                    text = text,
                    tokenUsage = TokenUsage(
                        promptTokens = usage?.promptTokenCount ?: 0,
                        responseTokens = usage?.candidatesTokenCount ?: 0,
                        totalTokens = usage?.totalTokenCount ?: 0
                    )
                )
            } else {
                val errorBody = response.errorBody()?.string()
                val errorResponse = try {
                    gson.fromJson(errorBody, GeminiErrorWrapper::class.java)
                } catch (e: Exception) { null }
                GeminiResult.Error(
                    message = errorResponse?.error?.message ?: "API error: ${response.code()}",
                    code = response.code()
                )
            }
        } catch (e: Exception) {
            GeminiResult.Error(message = e.message ?: "Unknown error occurred")
        }
    }

    fun streamContent(
        apiKey: String,
        modelId: String,
        messages: List<ChatMessage>,
        systemInstruction: String?,
        parameters: ModelParameters
    ): Flow<GeminiResult> = flow {
        try {
            val contents = messages
                .filter { !it.isLoading && !it.isError }
                .map { message ->
                    val parts = mutableListOf<Part>()
                    if (message.imageBase64 != null && message.imageMimeType != null) {
                        parts.add(Part(inlineData = InlineData(message.imageMimeType, message.imageBase64)))
                    }
                    if (message.text.isNotEmpty()) {
                        parts.add(Part(text = message.text))
                    }
                    Content(
                        role = if (message.role == MessageRole.USER) "user" else "model",
                        parts = parts.ifEmpty { listOf(Part(text = "")) }
                    )
                }

            val sysInstruction = if (!systemInstruction.isNullOrBlank()) {
                Content(role = "user", parts = listOf(Part(text = systemInstruction)))
            } else null

            val request = GeminiRequest(
                contents = contents,
                systemInstruction = sysInstruction,
                generationConfig = GenerationConfig(
                    temperature = parameters.temperature,
                    topP = parameters.topP,
                    topK = parameters.topK,
                    maxOutputTokens = parameters.maxOutputTokens
                )
            )

            val response = apiService.streamGenerateContent(modelId, apiKey, request = request)
            if (response.isSuccessful) {
                response.body()?.let { body ->
                    val reader = body.byteStream().bufferedReader()
                    var totalInputTokens = 0
                    var totalOutputTokens = 0

                    reader.lineSequence().forEach { line ->
                        if (line.startsWith("data: ")) {
                            val jsonStr = line.removePrefix("data: ").trim()
                            if (jsonStr.isNotEmpty() && jsonStr != "[DONE]") {
                                try {
                                    val chunk = gson.fromJson(jsonStr, GeminiResponse::class.java)
                                    val text = chunk.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                                    if (!text.isNullOrEmpty()) {
                                        emit(GeminiResult.StreamChunk(text))
                                    }
                                    chunk.usageMetadata?.let { usage ->
                                        totalInputTokens = usage.promptTokenCount
                                        totalOutputTokens = usage.candidatesTokenCount
                                    }
                                } catch (_: Exception) {}
                            }
                        }
                    }
                    emit(GeminiResult.StreamComplete(
                        TokenUsage(totalInputTokens, totalOutputTokens, totalInputTokens + totalOutputTokens)
                    ))
                }
            } else {
                emit(GeminiResult.Error("Stream error: ${response.code()}"))
            }
        } catch (e: Exception) {
            emit(GeminiResult.Error(e.message ?: "Stream failed"))
        }
    }

    suspend fun countTokens(
        apiKey: String,
        modelId: String,
        messages: List<ChatMessage>
    ): Int {
        return try {
            val contents = messages.map { msg ->
                Content(
                    role = if (msg.role == MessageRole.USER) "user" else "model",
                    parts = listOf(Part(text = msg.text))
                )
            }
            val response = apiService.countTokens(modelId, apiKey, CountTokensRequest(contents))
            response.body()?.totalTokens ?: 0
        } catch (e: Exception) { 0 }
    }

    fun getAvailableModels(): List<GeminiModel> = GeminiModel.ALL

    private data class GeminiErrorWrapper(val error: GeminiError?)
}
