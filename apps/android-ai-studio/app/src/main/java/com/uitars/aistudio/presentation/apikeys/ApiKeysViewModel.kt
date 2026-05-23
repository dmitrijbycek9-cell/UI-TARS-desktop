package com.uitars.aistudio.presentation.apikeys

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uitars.aistudio.data.db.ApiKeyDao
import com.uitars.aistudio.data.model.ApiKeyEntity
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ApiKeysViewModel @Inject constructor(
    private val apiKeyDao: ApiKeyDao
) : ViewModel() {

    val apiKeys: StateFlow<List<ApiKeyEntity>> = apiKeyDao.getAllApiKeys()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun addApiKey(name: String, keyValue: String) {
        viewModelScope.launch {
            val key = ApiKeyEntity(name = name, keyValue = keyValue)
            apiKeyDao.insertApiKey(key)
            // If it's the first key, activate it automatically
            if (apiKeys.value.isEmpty()) {
                apiKeyDao.deactivateAllKeys()
                apiKeyDao.activateKey(key.id)
            }
        }
    }

    fun activateKey(id: String) {
        viewModelScope.launch {
            apiKeyDao.deactivateAllKeys()
            apiKeyDao.activateKey(id)
        }
    }

    fun deleteApiKey(key: ApiKeyEntity) {
        viewModelScope.launch {
            apiKeyDao.deleteApiKey(key)
        }
    }
}
