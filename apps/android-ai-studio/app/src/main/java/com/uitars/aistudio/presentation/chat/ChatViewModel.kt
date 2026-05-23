package com.uitars.aistudio.presentation.chat

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uitars.aistudio.data.db.ApiKeyDao
import com.uitars.aistudio.data.model.ChatMessage
import com.uitars.aistudio.data.model.ConversationEntity
import com.uitars.aistudio.data.model.GeminiModel
import com.uitars.aistudio.data.model.MessageRole
import com.uitars.aistudio.data.model.ModelParameters
import com.uitars.aistudio.data.repository.ConversationRepository
import com.uitars.aistudio.data.repository.GeminiRepository
import com.uitars.aistudio.data.repository.GeminiResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import android.util.Base64
import javax.inject.Inject

data class ChatUiState(
    val conversation: ConversationEntity? = null,
    val messages: List<ChatMessage> = emptyList(),
    val isGenerating: Boolean = false,
    val error: String? = null,
    val totalTokens: Int = 0,
    val showSettings: Boolean = false
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val conversationRepository: ConversationRepository,
    private val geminiRepository: GeminiRepository,
    private val apiKeyDao: ApiKeyDao
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private var conversationId: String = ""

    fun loadConversation(id: String) {
        conversationId = id
        viewModelScope.launch {
            val conv = conversationRepository.getConversation(id)
            _uiState.value = _uiState.value.copy(conversation = conv)
        }
        viewModelScope.launch {
            conversationRepository.getMessages(id).collect { messages ->
                _uiState.value = _uiState.value.copy(messages = messages)
            }
        }
    }

    fun sendMessage(
        text: String,
        imageUri: Uri? = null,
        context: Context? = null
    ) {
        viewModelScope.launch {
            val apiKey = apiKeyDao.getActiveApiKey()?.keyValue
            if (apiKey.isNullOrBlank()) {
                _uiState.value = _uiState.value.copy(error = "No API key configured. Add one in API Keys settings.")
                return@launch
            }

            val conv = _uiState.value.conversation ?: return@launch

            var imageBase64: String? = null
            var imageMimeType: String? = null

            if (imageUri != null && context != null) {
                try {
                    val bytes = context.contentResolver.openInputStream(imageUri)?.readBytes()
                    imageBase64 = bytes?.let { Base64.encodeToString(it, Base64.NO_WRAP) }
                    imageMimeType = context.contentResolver.getType(imageUri) ?: "image/jpeg"
                } catch (_: Exception) {}
            }

            val userMessage = ChatMessage(
                role = MessageRole.USER,
                text = text,
                imageBase64 = imageBase64,
                imageMimeType = imageMimeType
            )
            conversationRepository.addMessage(conversationId, userMessage)

            val loadingMessage = ChatMessage(
                id = UUID.randomUUID().toString(),
                role = MessageRole.MODEL,
                text = "",
                isLoading = true
            )
            conversationRepository.addMessage(conversationId, loadingMessage)
            _uiState.value = _uiState.value.copy(isGenerating = true)

            val params = ModelParameters(
                temperature = conv.temperature,
                topP = conv.topP,
                topK = conv.topK,
                maxOutputTokens = conv.maxOutputTokens
            )

            val allMessages = _uiState.value.messages
                .filter { !it.isLoading && !it.isError }

            // Streaming
            var fullText = ""
            geminiRepository.streamContent(
                apiKey = apiKey,
                modelId = conv.modelId,
                messages = allMessages,
                systemInstruction = conv.systemInstruction.ifBlank { null },
                parameters = params
            ).collect { result ->
                when (result) {
                    is GeminiResult.StreamChunk -> {
                        fullText += result.text
                        val updatedLoading = loadingMessage.copy(text = fullText, isLoading = true)
                        conversationRepository.updateMessage(conversationId, updatedLoading)
                    }
                    is GeminiResult.StreamComplete -> {
                        val finalMessage = loadingMessage.copy(
                            text = fullText,
                            isLoading = false,
                            tokenCount = result.tokenUsage.responseTokens
                        )
                        conversationRepository.updateMessage(conversationId, finalMessage)
                        val totalTokens = _uiState.value.totalTokens + result.tokenUsage.totalTokens
                        _uiState.value = _uiState.value.copy(
                            isGenerating = false,
                            totalTokens = totalTokens
                        )
                        updateConversationTitle(allMessages + userMessage)
                    }
                    is GeminiResult.Error -> {
                        val errorMessage = loadingMessage.copy(
                            text = "",
                            isLoading = false,
                            isError = true,
                            errorMessage = result.message
                        )
                        conversationRepository.updateMessage(conversationId, errorMessage)
                        _uiState.value = _uiState.value.copy(
                            isGenerating = false,
                            error = result.message
                        )
                    }
                    else -> {}
                }
            }
        }
    }

    fun regenerateLastResponse() {
        val messages = _uiState.value.messages
        val lastModelIdx = messages.indexOfLast { it.role == MessageRole.MODEL }
        if (lastModelIdx < 0) return

        viewModelScope.launch {
            val lastModel = messages[lastModelIdx]
            conversationRepository.updateMessage(conversationId, lastModel.copy(
                text = "",
                isLoading = true,
                isError = false,
                errorMessage = null
            ))

            val apiKey = apiKeyDao.getActiveApiKey()?.keyValue ?: return@launch
            val conv = _uiState.value.conversation ?: return@launch
            val params = ModelParameters(
                temperature = conv.temperature,
                topP = conv.topP,
                topK = conv.topK,
                maxOutputTokens = conv.maxOutputTokens
            )

            val contextMessages = messages.subList(0, lastModelIdx)
            var fullText = ""

            geminiRepository.streamContent(
                apiKey = apiKey,
                modelId = conv.modelId,
                messages = contextMessages,
                systemInstruction = conv.systemInstruction.ifBlank { null },
                parameters = params
            ).collect { result ->
                when (result) {
                    is GeminiResult.StreamChunk -> {
                        fullText += result.text
                        conversationRepository.updateMessage(
                            conversationId,
                            lastModel.copy(text = fullText, isLoading = true)
                        )
                    }
                    is GeminiResult.StreamComplete -> {
                        conversationRepository.updateMessage(
                            conversationId,
                            lastModel.copy(text = fullText, isLoading = false, tokenCount = result.tokenUsage.responseTokens)
                        )
                        _uiState.value = _uiState.value.copy(isGenerating = false)
                    }
                    is GeminiResult.Error -> {
                        conversationRepository.updateMessage(
                            conversationId,
                            lastModel.copy(isLoading = false, isError = true, errorMessage = result.message)
                        )
                        _uiState.value = _uiState.value.copy(isGenerating = false)
                    }
                    else -> {}
                }
            }
        }
    }

    fun updateSystemInstruction(instruction: String) {
        viewModelScope.launch {
            val conv = _uiState.value.conversation ?: return@launch
            val updated = conv.copy(systemInstruction = instruction)
            conversationRepository.updateConversation(updated)
            _uiState.value = _uiState.value.copy(conversation = updated)
        }
    }

    fun updateParameters(params: ModelParameters) {
        viewModelScope.launch {
            val conv = _uiState.value.conversation ?: return@launch
            val updated = conv.copy(
                temperature = params.temperature,
                topP = params.topP,
                topK = params.topK,
                maxOutputTokens = params.maxOutputTokens
            )
            conversationRepository.updateConversation(updated)
            _uiState.value = _uiState.value.copy(conversation = updated)
        }
    }

    fun updateModel(modelId: String) {
        viewModelScope.launch {
            val conv = _uiState.value.conversation ?: return@launch
            val updated = conv.copy(modelId = modelId)
            conversationRepository.updateConversation(updated)
            _uiState.value = _uiState.value.copy(conversation = updated)
        }
    }

    fun clearConversation() {
        viewModelScope.launch {
            conversationRepository.deleteMessages(conversationId)
            _uiState.value = _uiState.value.copy(totalTokens = 0)
        }
    }

    fun toggleSettings() {
        _uiState.value = _uiState.value.copy(showSettings = !_uiState.value.showSettings)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    private suspend fun updateConversationTitle(messages: List<ChatMessage>) {
        val conv = _uiState.value.conversation ?: return
        if (conv.title == "New Chat" && messages.isNotEmpty()) {
            val firstUserMsg = messages.firstOrNull { it.role == MessageRole.USER }?.text ?: return
            val title = firstUserMsg.take(50).let {
                if (it.length == 50) "$it..." else it
            }
            conversationRepository.updateTitle(conversationId, title)
            _uiState.value = _uiState.value.copy(conversation = conv.copy(title = title))
        }
    }
}
