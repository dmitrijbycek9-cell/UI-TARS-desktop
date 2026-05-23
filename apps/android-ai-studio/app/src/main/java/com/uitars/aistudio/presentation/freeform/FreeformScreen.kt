package com.uitars.aistudio.presentation.freeform

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.uitars.aistudio.data.model.GeminiModel
import com.uitars.aistudio.data.model.ModelParameters
import com.uitars.aistudio.presentation.chat.ChatViewModel
import com.uitars.aistudio.presentation.components.ParametersPanel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FreeformScreen(
    conversationId: String,
    onNavigateBack: () -> Unit,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var promptText by remember { mutableStateOf("") }
    var systemInstruction by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var showParametersPanel by remember { mutableStateOf(false) }
    var showOutput by remember { mutableStateOf(false) }
    val outputText = uiState.messages.lastOrNull { it.role == com.uitars.aistudio.data.model.MessageRole.MODEL }?.text ?: ""
    val isLoading = uiState.isGenerating

    val imagePickerLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri -> selectedImageUri = uri }

    val bottomSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    LaunchedEffect(conversationId) {
        viewModel.loadConversation(conversationId)
    }

    LaunchedEffect(uiState.conversation?.systemInstruction) {
        systemInstruction = uiState.conversation?.systemInstruction ?: ""
    }

    LaunchedEffect(outputText) {
        if (outputText.isNotEmpty()) showOutput = true
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("Freeform Prompt", fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    if (uiState.totalTokens > 0) {
                        Text(
                            "${uiState.totalTokens} tokens",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(end = 4.dp)
                        )
                    }
                    IconButton(onClick = { showParametersPanel = true }) {
                        Icon(Icons.Default.Tune, "Parameters")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // System instruction section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ManageAccounts, null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("System Instructions", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = systemInstruction,
                        onValueChange = {
                            systemInstruction = it
                            viewModel.updateSystemInstruction(it)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        maxLines = 4,
                        placeholder = { Text("Optional: Give the model context or a persona...", style = MaterialTheme.typography.bodySmall) },
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }

            // Prompt section
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.secondary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Prompt", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                        }
                        IconButton(onClick = { imagePickerLauncher.launch("image/*") }, modifier = Modifier.size(32.dp)) {
                            Icon(Icons.Default.Image, "Attach image", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
                        }
                    }

                    selectedImageUri?.let {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(vertical = 8.dp)
                        ) {
                            Icon(Icons.Default.Image, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Image attached", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                            IconButton(onClick = { selectedImageUri = null }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Close, null, modifier = Modifier.size(14.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = promptText,
                        onValueChange = { promptText = it },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 4,
                        maxLines = 12,
                        placeholder = { Text("Enter your prompt here...") },
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }

            // Run button
            Button(
                onClick = {
                    if (promptText.isNotBlank()) {
                        viewModel.clearConversation()
                        viewModel.sendMessage(promptText, selectedImageUri, context)
                        showOutput = true
                    }
                },
                enabled = promptText.isNotBlank() && !isLoading,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Generating...")
                } else {
                    Icon(Icons.Default.PlayArrow, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Run", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                }
            }

            // Output section
            AnimatedContent(targetState = showOutput || isLoading) { show ->
                if (show) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(20.dp), tint = MaterialTheme.colorScheme.primary)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Response", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                                }
                                if (outputText.isNotEmpty()) {
                                    IconButton(
                                        onClick = { /* Copy to clipboard */ },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(Icons.Default.ContentCopy, "Copy", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            if (isLoading && outputText.isEmpty()) {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(8.dp)) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Generating response...", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            } else if (outputText.isNotEmpty()) {
                                SelectionContainer {
                                    Text(
                                        outputText,
                                        style = MaterialTheme.typography.bodyMedium,
                                        lineHeight = 22.sp,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                                if (uiState.totalTokens > 0) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        "Total tokens: ${uiState.totalTokens}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    if (showParametersPanel) {
        ModalBottomSheet(
            onDismissRequest = { showParametersPanel = false },
            sheetState = bottomSheetState
        ) {
            val conv = uiState.conversation
            if (conv != null) {
                ParametersPanel(
                    params = ModelParameters(conv.temperature, conv.topP, conv.topK, conv.maxOutputTokens),
                    availableModels = GeminiModel.ALL,
                    selectedModelId = conv.modelId,
                    onParamsChanged = { viewModel.updateParameters(it) },
                    onModelChanged = { viewModel.updateModel(it) },
                    onDismiss = { showParametersPanel = false }
                )
            }
        }
    }
}

@Composable
private fun AnimatedContent(targetState: Boolean, content: @Composable (Boolean) -> Unit) {
    androidx.compose.animation.AnimatedContent(
        targetState = targetState,
        transitionSpec = {
            androidx.compose.animation.fadeIn() togetherWith androidx.compose.animation.fadeOut()
        }
    ) { state ->
        content(state)
    }
}

@Composable
private fun SelectionContainer(content: @Composable () -> Unit) {
    androidx.compose.foundation.text.selection.SelectionContainer {
        content()
    }
}
