package com.uitars.aistudio.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.uitars.aistudio.data.repository.AuthRepository
import com.uitars.aistudio.data.repository.AuthResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    val isLoggedIn: StateFlow<Boolean> = MutableStateFlow(authRepository.isLoggedIn).also { flow ->
        viewModelScope.launch {
            authRepository.observeAuthState().collect { user ->
                (flow as MutableStateFlow).value = user != null
            }
        }
    }.asStateFlow()

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun signInWithEmail(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            when (val result = authRepository.signInWithEmail(email, password)) {
                is AuthResult.Success -> _uiState.value = AuthUiState(isSuccess = true)
                is AuthResult.Error -> _uiState.value = AuthUiState(error = result.message)
                else -> {}
            }
        }
    }

    fun registerWithEmail(email: String, password: String, displayName: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            when (val result = authRepository.registerWithEmail(email, password, displayName)) {
                is AuthResult.Success -> _uiState.value = AuthUiState(isSuccess = true)
                is AuthResult.Error -> _uiState.value = AuthUiState(error = result.message)
                else -> {}
            }
        }
    }

    fun signInWithGoogle(idToken: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState(isLoading = true)
            when (val result = authRepository.signInWithGoogle(idToken)) {
                is AuthResult.Success -> _uiState.value = AuthUiState(isSuccess = true)
                is AuthResult.Error -> _uiState.value = AuthUiState(error = result.message)
                else -> {}
            }
        }
    }

    fun sendPasswordReset(email: String) {
        viewModelScope.launch {
            authRepository.sendPasswordReset(email)
        }
    }

    fun signOut() {
        authRepository.signOut()
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
