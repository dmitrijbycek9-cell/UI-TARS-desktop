package com.uitars.aistudio.data.model

import com.google.gson.annotations.SerializedName

// ─── API Request/Response models ───────────────────────────────────────────

data class GeminiRequest(
    @SerializedName("contents") val contents: List<Content>,
    @SerializedName("systemInstruction") val systemInstruction: Content? = null,
    @SerializedName("generationConfig") val generationConfig: GenerationConfig? = null,
    @SerializedName("tools") val tools: List<Tool>? = null,
    @SerializedName("safetySettings") val safetySettings: List<SafetySetting>? = null
)

data class Content(
    @SerializedName("role") val role: String,
    @SerializedName("parts") val parts: List<Part>
)

data class Part(
    @SerializedName("text") val text: String? = null,
    @SerializedName("inlineData") val inlineData: InlineData? = null,
    @SerializedName("functionCall") val functionCall: FunctionCall? = null,
    @SerializedName("functionResponse") val functionResponse: FunctionResponse? = null
)

data class InlineData(
    @SerializedName("mimeType") val mimeType: String,
    @SerializedName("data") val data: String
)

data class GenerationConfig(
    @SerializedName("temperature") val temperature: Float? = null,
    @SerializedName("topP") val topP: Float? = null,
    @SerializedName("topK") val topK: Int? = null,
    @SerializedName("maxOutputTokens") val maxOutputTokens: Int? = null,
    @SerializedName("stopSequences") val stopSequences: List<String>? = null,
    @SerializedName("responseMimeType") val responseMimeType: String? = null,
    @SerializedName("responseSchema") val responseSchema: Any? = null
)

data class SafetySetting(
    @SerializedName("category") val category: String,
    @SerializedName("threshold") val threshold: String
)

data class Tool(
    @SerializedName("functionDeclarations") val functionDeclarations: List<FunctionDeclaration>? = null,
    @SerializedName("codeExecution") val codeExecution: Any? = null
)

data class FunctionDeclaration(
    @SerializedName("name") val name: String,
    @SerializedName("description") val description: String,
    @SerializedName("parameters") val parameters: Any? = null
)

data class FunctionCall(
    @SerializedName("name") val name: String,
    @SerializedName("args") val args: Map<String, Any>
)

data class FunctionResponse(
    @SerializedName("name") val name: String,
    @SerializedName("response") val response: Map<String, Any>
)

// ─── Response ───────────────────────────────────────────────────────────────

data class GeminiResponse(
    @SerializedName("candidates") val candidates: List<Candidate>?,
    @SerializedName("usageMetadata") val usageMetadata: UsageMetadata?,
    @SerializedName("error") val error: GeminiError?
)

data class Candidate(
    @SerializedName("content") val content: Content,
    @SerializedName("finishReason") val finishReason: String?,
    @SerializedName("safetyRatings") val safetyRatings: List<SafetyRating>?
)

data class SafetyRating(
    @SerializedName("category") val category: String,
    @SerializedName("probability") val probability: String
)

data class UsageMetadata(
    @SerializedName("promptTokenCount") val promptTokenCount: Int,
    @SerializedName("candidatesTokenCount") val candidatesTokenCount: Int,
    @SerializedName("totalTokenCount") val totalTokenCount: Int
)

data class GeminiError(
    @SerializedName("code") val code: Int,
    @SerializedName("message") val message: String,
    @SerializedName("status") val status: String
)

data class CountTokensRequest(
    @SerializedName("contents") val contents: List<Content>
)

data class CountTokensResponse(
    @SerializedName("totalTokens") val totalTokens: Int
)

// ─── Available Models ────────────────────────────────────────────────────────

data class GeminiModel(
    val id: String,
    val displayName: String,
    val description: String,
    val inputTokenLimit: Int,
    val outputTokenLimit: Int,
    val supportsImages: Boolean = false,
    val supportsAudio: Boolean = false,
    val supportsVideo: Boolean = false,
    val supportsCode: Boolean = false,
    val supportsFunctionCalling: Boolean = false
) {
    companion object {
        val ALL = listOf(
            GeminiModel(
                id = "gemini-2.0-flash",
                displayName = "Gemini 2.0 Flash",
                description = "Next generation multimodal model, fast and versatile",
                inputTokenLimit = 1_048_576,
                outputTokenLimit = 8192,
                supportsImages = true,
                supportsAudio = true,
                supportsVideo = true,
                supportsCode = true,
                supportsFunctionCalling = true
            ),
            GeminiModel(
                id = "gemini-2.0-flash-lite",
                displayName = "Gemini 2.0 Flash-Lite",
                description = "Lightweight and cost-efficient, for simple tasks",
                inputTokenLimit = 1_048_576,
                outputTokenLimit = 8192,
                supportsImages = true,
                supportsCode = false,
                supportsFunctionCalling = true
            ),
            GeminiModel(
                id = "gemini-1.5-pro",
                displayName = "Gemini 1.5 Pro",
                description = "Best performing multimodal model for complex reasoning",
                inputTokenLimit = 2_097_152,
                outputTokenLimit = 8192,
                supportsImages = true,
                supportsAudio = true,
                supportsVideo = true,
                supportsCode = true,
                supportsFunctionCalling = true
            ),
            GeminiModel(
                id = "gemini-1.5-flash",
                displayName = "Gemini 1.5 Flash",
                description = "Fast and versatile multimodal model for diverse tasks",
                inputTokenLimit = 1_048_576,
                outputTokenLimit = 8192,
                supportsImages = true,
                supportsAudio = true,
                supportsVideo = true,
                supportsCode = true,
                supportsFunctionCalling = true
            ),
            GeminiModel(
                id = "gemini-1.5-flash-8b",
                displayName = "Gemini 1.5 Flash-8B",
                description = "High volume and lower intelligence tasks",
                inputTokenLimit = 1_048_576,
                outputTokenLimit = 8192,
                supportsImages = true,
                supportsFunctionCalling = true
            )
        )
    }
}
