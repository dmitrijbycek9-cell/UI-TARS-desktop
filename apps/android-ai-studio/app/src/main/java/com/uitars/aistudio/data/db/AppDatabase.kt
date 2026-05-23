package com.uitars.aistudio.data.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.uitars.aistudio.data.model.ApiKeyEntity
import com.uitars.aistudio.data.model.ConversationEntity
import com.uitars.aistudio.data.model.MessageEntity
import com.uitars.aistudio.data.model.PromptTemplateEntity

@Database(
    entities = [
        ConversationEntity::class,
        MessageEntity::class,
        ApiKeyEntity::class,
        PromptTemplateEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun conversationDao(): ConversationDao
    abstract fun messageDao(): MessageDao
    abstract fun apiKeyDao(): ApiKeyDao
    abstract fun promptTemplateDao(): PromptTemplateDao
}
