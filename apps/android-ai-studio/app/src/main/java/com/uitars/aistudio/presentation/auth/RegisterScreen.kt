package com.uitars.aistudio.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.uitars.aistudio.presentation.theme.GoogleBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onNavigateToLogin: () -> Unit,
    onRegisterSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

    var displayName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }

    val passwordsMatch = password == confirmPassword
    val isFormValid = displayName.isNotBlank() && email.isNotBlank() &&
            password.length >= 8 && passwordsMatch

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) onRegisterSuccess()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF0F0F1A), Color(0xFF1A1A2E))))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(60.dp))

            IconButton(
                onClick = onNavigateToLogin,
                modifier = Modifier.align(Alignment.Start)
            ) {
                Icon(Icons.Default.ArrowBack, "Back", tint = Color.White)
            }

            Text(
                "Create Account",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            Text(
                "Join AI Studio",
                color = Color(0xFF9AA0A6),
                modifier = Modifier.padding(top = 4.dp, bottom = 32.dp)
            )

            listOf(
                Triple("Full Name", displayName, Icons.Default.Person),
                Triple("Email", email, Icons.Default.Email),
            ).forEachIndexed { index, (label, value, icon) ->
                OutlinedTextField(
                    value = value,
                    onValueChange = { newVal ->
                        when (index) {
                            0 -> displayName = newVal
                            1 -> email = newVal
                        }
                    },
                    label = { Text(label) },
                    leadingIcon = { Icon(icon, null, tint = Color(0xFF9AA0A6)) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = if (index == 1) KeyboardType.Email else KeyboardType.Text,
                        imeAction = ImeAction.Next
                    ),
                    keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = GoogleBlue,
                        unfocusedBorderColor = Color(0xFF3C4043),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedContainerColor = Color(0xFF2D2D3D),
                        unfocusedContainerColor = Color(0xFF2D2D3D)
                    ),
                    singleLine = true
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password (min 8 chars)") },
                leadingIcon = { Icon(Icons.Default.Lock, null, tint = Color(0xFF9AA0A6)) },
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                            null,
                            tint = Color(0xFF9AA0A6)
                        )
                    }
                },
                visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Next),
                keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                isError = password.isNotEmpty() && password.length < 8,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = GoogleBlue,
                    unfocusedBorderColor = Color(0xFF3C4043),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedContainerColor = Color(0xFF2D2D3D),
                    unfocusedContainerColor = Color(0xFF2D2D3D)
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                label = { Text("Confirm Password") },
                leadingIcon = { Icon(Icons.Default.Lock, null, tint = Color(0xFF9AA0A6)) },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                isError = confirmPassword.isNotEmpty() && !passwordsMatch,
                supportingText = {
                    if (confirmPassword.isNotEmpty() && !passwordsMatch) {
                        Text("Passwords don't match", color = MaterialTheme.colorScheme.error)
                    }
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = {
                    focusManager.clearFocus()
                    if (isFormValid) viewModel.registerWithEmail(email, password, displayName)
                }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = GoogleBlue,
                    unfocusedBorderColor = Color(0xFF3C4043),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedContainerColor = Color(0xFF2D2D3D),
                    unfocusedContainerColor = Color(0xFF2D2D3D)
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = { viewModel.registerWithEmail(email, password, displayName) },
                enabled = isFormValid && !uiState.isLoading,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = GoogleBlue)
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text("Create Account", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Already have an account?", color = Color(0xFF9AA0A6), fontSize = 14.sp)
                TextButton(onClick = onNavigateToLogin) {
                    Text("Sign in", color = GoogleBlue, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                }
            }

            uiState.error?.let { error ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFB3261E)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(error, color = Color.White, modifier = Modifier.padding(12.dp))
                }
                LaunchedEffect(error) {
                    kotlinx.coroutines.delay(4000)
                    viewModel.clearError()
                }
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}
