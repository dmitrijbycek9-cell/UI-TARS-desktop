package com.uitars.aistudio.data.db

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.uitars.aistudio.data.model.ApiKeyEntity
import com.uitars.aistudio.data.model.ConversationEntity
import com.uitars.aistudio.data.model.MessageEntity
import com.uitars.aistudio.data.model.PromptTemplateEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ConversationDao {
    @Query("SELECT * FROM conversations ORDER BY updatedAt DESC")
    fun getAllConversations(): Flow<List<ConversationEntity>>

    @Query("SELECT * FROM conversations WHERE id = :id")
    suspend fun getConversationById(id: String): ConversationEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConversation(conversation: ConversationEntity)

    @Update
    suspend fun updateConversation(conversation: ConversationEntity)

    @Delete
    suspend fun deleteConversation(conversation: ConversationEntity)

    @Query("DELETE FROM conversations WHERE id = :id")
    suspend fun deleteConversationById(id: String)

    @Query("UPDATE conversations SET title = :title, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateTitle(id: String, title: String, updatedAt: Long = System.currentTimeMillis())

    @Query("UPDATE conversations SET totalTokens = :tokens, updatedAt = :updatedAt WHERE id = :id")
    suspend fun updateTokens(id: String, tokens: Int, updatedAt: Long = System.currentTimeMillis())
}

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt ASC")
    fun getMessagesByConversation(conversationId: String): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE conversationId = :conversationId ORDER BY createdAt ASC")
    suspend fun getMessagesByConversationOnce(conversationId: String): List<MessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity)

    @Update
    suspend fun updateMessage(message: MessageEntity)

    @Delete
    suspend fun deleteMessage(message: MessageEntity)

    @Query("DELETE FROM messages WHERE conversationId = :conversationId")
    suspend fun deleteMessagesByConversation(conversationId: String)

    @Query("SELECT COUNT(*) FROM messages WHERE conversationId = :conversationId")
    suspend fun getMessageCount(conversationId: String): Int
}

@Dao
interface ApiKeyDao {
    @Query("SELECT * FROM api_keys ORDER BY createdAt DESC")
    fun getAllApiKeys(): Flow<List<ApiKeyEntity>>

    @Query("SELECT * FROM api_keys WHERE isActive = 1 LIMIT 1")
    suspend fun getActiveApiKey(): ApiKeyEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertApiKey(apiKey: ApiKeyEntity)

    @Update
    suspend fun updateApiKey(apiKey: ApiKeyEntity)

    @Delete
    suspend fun deleteApiKey(apiKey: ApiKeyEntity)

    @Query("UPDATE api_keys SET isActive = 0")
    suspend fun deactivateAllKeys()

    @Query("UPDATE api_keys SET isActive = 1 WHERE id = :id")
    suspend fun activateKey(id: String)
}

@Dao
interface PromptTemplateDao {
    @Query("SELECT * FROM prompt_templates ORDER BY createdAt DESC")
    fun getAllTemplates(): Flow<List<PromptTemplateEntity>>

    @Query("SELECT * FROM prompt_templates WHERE category = :category ORDER BY createdAt DESC")
    fun getTemplatesByCategory(category: String): Flow<List<PromptTemplateEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTemplate(template: PromptTemplateEntity)

    @Update
    suspend fun updateTemplate(template: PromptTemplateEntity)

    @Delete
    suspend fun deleteTemplate(template: PromptTemplateEntity)
}
