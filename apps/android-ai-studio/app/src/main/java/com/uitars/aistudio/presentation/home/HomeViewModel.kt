package com.uitars.aistudio.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uitars.aistudio.data.model.ConversationEntity
import com.uitars.aistudio.data.model.GeminiModel
import com.uitars.aistudio.data.model.ModelParameters
import com.uitars.aistudio.data.repository.AuthRepository
import com.uitars.aistudio.data.repository.ConversationRepository
import com.uitars.aistudio.data.repository.GeminiRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val conversationRepository: ConversationRepository,
    private val geminiRepository: GeminiRepository,
    val authRepository: AuthRepository
) : ViewModel() {

    val conversations: StateFlow<List<ConversationEntity>> =
        conversationRepository.getAllConversations()
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val availableModels: List<GeminiModel> = geminiRepository.getAvailableModels()

    private val _selectedModel = MutableStateFlow(availableModels.first())
    val selectedModel: StateFlow<GeminiModel> = _selectedModel.asStateFlow()

    fun selectModel(model: GeminiModel) {
        _selectedModel.value = model
    }

    fun createChatConversation(onCreated: (String) -> Unit) {
        viewModelScope.launch {
            val conv = conversationRepository.createConversation(
                title = "New Chat",
                modelId = _selectedModel.value.id,
                mode = "CHAT"
            )
            onCreated(conv.id)
        }
    }

    fun createFreeformConversation(onCreated: (String) -> Unit) {
        viewModelScope.launch {
            val conv = conversationRepository.createConversation(
                title = "New Prompt",
                modelId = _selectedModel.value.id,
                mode = "FREEFORM"
            )
            onCreated(conv.id)
        }
    }

    fun deleteConversation(id: String) {
        viewModelScope.launch {
            conversationRepository.deleteConversation(id)
        }
    }

    fun signOut() {
        authRepository.signOut()
    }
}
