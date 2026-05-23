package com.uitars.aistudio.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.UUID

// ─── Local database entities ─────────────────────────────────────────────────

@Entity(tableName = "conversations")
data class ConversationEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val title: String,
    val modelId: String,
    val systemInstruction: String = "",
    val temperature: Float = 0.7f,
    val topP: Float = 0.95f,
    val topK: Int = 40,
    val maxOutputTokens: Int = 8192,
    val mode: String = ConversationMode.CHAT.name,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val totalTokens: Int = 0,
    val firebaseId: String = ""
)

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val conversationId: String,
    val role: String,
    val text: String,
    val imageBase64: String? = null,
    val imageMimeType: String? = null,
    val isLoading: Boolean = false,
    val isError: Boolean = false,
    val errorMessage: String? = null,
    val tokenCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val firebaseId: String = ""
)

@Entity(tableName = "api_keys")
data class ApiKeyEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val keyValue: String,
    val isActive: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val lastUsedAt: Long? = null
)

@Entity(tableName = "prompt_templates")
data class PromptTemplateEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val description: String,
    val promptText: String,
    val modelId: String,
    val systemInstruction: String = "",
    val category: String = "General",
    val createdAt: Long = System.currentTimeMillis()
)

// ─── UI state models ─────────────────────────────────────────────────────────

enum class ConversationMode {
    CHAT, FREEFORM, STRUCTURED
}

data class ChatMessage(
    val id: String = UUID.randomUUID().toString(),
    val role: MessageRole,
    val text: String,
    val imageBase64: String? = null,
    val imageMimeType: String? = null,
    val isLoading: Boolean = false,
    val isError: Boolean = false,
    val errorMessage: String? = null,
    val tokenCount: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)

enum class MessageRole { USER, MODEL, SYSTEM }

data class ModelParameters(
    val temperature: Float = 0.7f,
    val topP: Float = 0.95f,
    val topK: Int = 40,
    val maxOutputTokens: Int = 8192,
    val stopSequences: List<String> = emptyList()
)

data class UserProfile(
    val uid: String,
    val email: String,
    val displayName: String,
    val photoUrl: String?
)

data class StructuredOutputSchema(
    val type: String = "object",
    val properties: Map<String, SchemaProperty> = emptyMap(),
    val required: List<String> = emptyList()
)

data class SchemaProperty(
    val type: String,
    val description: String = "",
    val enum: List<String>? = null
)

data class FunctionTool(
    val name: String,
    val description: String,
    val parametersJson: String = "{}"
)

data class TokenUsage(
    val promptTokens: Int = 0,
    val responseTokens: Int = 0,
    val totalTokens: Int = 0
)
