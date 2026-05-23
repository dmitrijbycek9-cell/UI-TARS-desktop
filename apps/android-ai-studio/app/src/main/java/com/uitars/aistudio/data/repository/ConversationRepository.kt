package com.uitars.aistudio.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.uitars.aistudio.data.db.ConversationDao
import com.uitars.aistudio.data.db.MessageDao
import com.uitars.aistudio.data.model.ChatMessage
import com.uitars.aistudio.data.model.ConversationEntity
import com.uitars.aistudio.data.model.MessageEntity
import com.uitars.aistudio.data.model.MessageRole
import com.uitars.aistudio.data.model.ModelParameters
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ConversationRepository @Inject constructor(
    private val conversationDao: ConversationDao,
    private val messageDao: MessageDao,
    private val firestore: FirebaseFirestore,
    private val auth: FirebaseAuth
) {

    fun getAllConversations(): Flow<List<ConversationEntity>> =
        conversationDao.getAllConversations()

    suspend fun getConversation(id: String): ConversationEntity? =
        conversationDao.getConversationById(id)

    suspend fun createConversation(
        title: String,
        modelId: String,
        systemInstruction: String = "",
        parameters: ModelParameters = ModelParameters(),
        mode: String = "CHAT"
    ): ConversationEntity {
        val conv = ConversationEntity(
            title = title,
            modelId = modelId,
            systemInstruction = systemInstruction,
            temperature = parameters.temperature,
            topP = parameters.topP,
            topK = parameters.topK,
            maxOutputTokens = parameters.maxOutputTokens,
            mode = mode
        )
        conversationDao.insertConversation(conv)
        syncConversationToFirebase(conv)
        return conv
    }

    suspend fun updateConversation(conversation: ConversationEntity) {
        val updated = conversation.copy(updatedAt = System.currentTimeMillis())
        conversationDao.updateConversation(updated)
        syncConversationToFirebase(updated)
    }

    suspend fun deleteConversation(id: String) {
        conversationDao.deleteConversationById(id)
        messageDao.deleteMessagesByConversation(id)
        deleteConversationFromFirebase(id)
    }

    suspend fun updateTitle(id: String, title: String) {
        conversationDao.updateTitle(id, title)
    }

    fun getMessages(conversationId: String): Flow<List<ChatMessage>> =
        messageDao.getMessagesByConversation(conversationId).map { entities ->
            entities.map { it.toChatMessage() }
        }

    suspend fun addMessage(conversationId: String, message: ChatMessage) {
        val entity = message.toEntity(conversationId)
        messageDao.insertMessage(entity)
        syncMessageToFirebase(conversationId, entity)
    }

    suspend fun updateMessage(conversationId: String, message: ChatMessage) {
        val entity = message.toEntity(conversationId)
        messageDao.updateMessage(entity)
    }

    suspend fun deleteMessages(conversationId: String) {
        messageDao.deleteMessagesByConversation(conversationId)
    }

    private fun ChatMessage.toEntity(conversationId: String) = MessageEntity(
        id = id,
        conversationId = conversationId,
        role = role.name,
        text = text,
        imageBase64 = imageBase64,
        imageMimeType = imageMimeType,
        isLoading = isLoading,
        isError = isError,
        errorMessage = errorMessage,
        tokenCount = tokenCount,
        createdAt = createdAt
    )

    private fun MessageEntity.toChatMessage() = ChatMessage(
        id = id,
        role = MessageRole.valueOf(role),
        text = text,
        imageBase64 = imageBase64,
        imageMimeType = imageMimeType,
        isLoading = isLoading,
        isError = isError,
        errorMessage = errorMessage,
        tokenCount = tokenCount,
        createdAt = createdAt
    )

    private fun syncConversationToFirebase(conversation: ConversationEntity) {
        val uid = auth.currentUser?.uid ?: return
        try {
            firestore.collection("users").document(uid)
                .collection("conversations").document(conversation.id)
                .set(conversation)
        } catch (_: Exception) {}
    }

    private fun deleteConversationFromFirebase(id: String) {
        val uid = auth.currentUser?.uid ?: return
        try {
            firestore.collection("users").document(uid)
                .collection("conversations").document(id)
                .delete()
        } catch (_: Exception) {}
    }

    private fun syncMessageToFirebase(conversationId: String, message: MessageEntity) {
        val uid = auth.currentUser?.uid ?: return
        try {
            firestore.collection("users").document(uid)
                .collection("conversations").document(conversationId)
                .collection("messages").document(message.id)
                .set(message)
        } catch (_: Exception) {}
    }
}
