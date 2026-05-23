package com.uitars.aistudio.presentation.chat

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.uitars.aistudio.data.model.ChatMessage
import com.uitars.aistudio.data.model.GeminiModel
import com.uitars.aistudio.data.model.MessageRole
import com.uitars.aistudio.data.model.ModelParameters
import com.uitars.aistudio.presentation.components.ParametersPanel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    conversationId: String,
    onNavigateBack: () -> Unit,
    onNavigateToSettings: () -> Unit,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val listState = rememberLazyListState()
    val scope = coroutineScope()

    var inputText by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var showSystemInstructions by remember { mutableStateOf(false) }
    var showParametersPanel by remember { mutableStateOf(false) }
    var tempSystemInstruction by remember { mutableStateOf("") }

    val imagePickerLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri -> selectedImageUri = uri }

    LaunchedEffect(conversationId) {
        viewModel.loadConversation(conversationId)
    }

    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size - 1)
        }
    }

    LaunchedEffect(uiState.conversation?.systemInstruction) {
        tempSystemInstruction = uiState.conversation?.systemInstruction ?: ""
    }

    val bottomSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            uiState.conversation?.title ?: "Chat",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 16.sp,
                            maxLines = 1
                        )
                        Text(
                            uiState.conversation?.modelId?.replace("models/", "") ?: "",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    // Token count
                    if (uiState.totalTokens > 0) {
                        Text(
                            "${uiState.totalTokens} tokens",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(end = 4.dp)
                        )
                    }
                    IconButton(onClick = { showSystemInstructions = true }) {
                        Icon(Icons.Default.ManageAccounts, "System Instructions", modifier = Modifier.size(22.dp))
                    }
                    IconButton(onClick = { showParametersPanel = true }) {
                        Icon(Icons.Default.Tune, "Parameters", modifier = Modifier.size(22.dp))
                    }
                    IconButton(onClick = { viewModel.clearConversation() }) {
                        Icon(Icons.Default.DeleteSweep, "Clear", modifier = Modifier.size(22.dp))
                    }
                }
            )
        },
        bottomBar = {
            ChatInputBar(
                inputText = inputText,
                selectedImageUri = selectedImageUri,
                isGenerating = uiState.isGenerating,
                onTextChange = { inputText = it },
                onSendMessage = {
                    if (inputText.isNotBlank() || selectedImageUri != null) {
                        viewModel.sendMessage(inputText, selectedImageUri, context)
                        inputText = ""
                        selectedImageUri = null
                    }
                },
                onAttachImage = { imagePickerLauncher.launch("image/*") },
                onRemoveImage = { selectedImageUri = null }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            if (uiState.messages.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.AutoAwesome,
                            null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "Start a conversation",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            "with ${uiState.conversation?.modelId ?: "Gemini"}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        )
                    }
                }
            } else {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.messages, key = { it.id }) { message ->
                        MessageBubble(
                            message = message,
                            onRegenerate = if (
                                message.role == MessageRole.MODEL &&
                                message == uiState.messages.last() &&
                                !uiState.isGenerating
                            ) {{ viewModel.regenerateLastResponse() }} else null
                        )
                    }
                }
            }
        }

        // Error snackbar
        uiState.error?.let { error ->
            LaunchedEffect(error) {
                kotlinx.coroutines.delay(4000)
                viewModel.clearError()
            }
        }
    }

    // System instruction bottom sheet
    if (showSystemInstructions) {
        ModalBottomSheet(
            onDismissRequest = { showSystemInstructions = false },
            sheetState = bottomSheetState
        ) {
            Column(modifier = Modifier.fillMaxWidth().padding(24.dp)) {
                Text("System Instructions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Give the model a persona or specific context",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = tempSystemInstruction,
                    onValueChange = { tempSystemInstruction = it },
                    modifier = Modifier.fillMaxWidth().height(180.dp),
                    placeholder = { Text("e.g. You are a helpful coding assistant...") },
                    label = { Text("System instruction") }
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = { showSystemInstructions = false }) { Text("Cancel") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(onClick = {
                        viewModel.updateSystemInstruction(tempSystemInstruction)
                        showSystemInstructions = false
                    }) { Text("Apply") }
                }
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    // Parameters bottom sheet
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
private fun coroutineScope() = rememberCoroutineScope()

@Composable
private fun MessageBubble(
    message: ChatMessage,
    onRegenerate: (() -> Unit)?
) {
    val isUser = message.role == MessageRole.USER
    val isLoading = message.isLoading
    val isError = message.isError

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        if (!isUser) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onPrimaryContainer)
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        Column(modifier = Modifier.weight(1f, fill = false)) {
            if (isError) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    shape = RoundedCornerShape(16.dp, 16.dp, if (isUser) 4.dp else 16.dp, if (isUser) 16.dp else 4.dp),
                    modifier = Modifier.widthIn(max = 300.dp)
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Error, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            message.errorMessage ?: "An error occurred",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            } else {
                Surface(
                    shape = RoundedCornerShape(
                        topStart = 16.dp, topEnd = 16.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp
                    ),
                    color = if (isUser) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.widthIn(max = 300.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        if (isLoading && message.text.isEmpty()) {
                            LoadingDots()
                        } else {
                            SelectionContainer {
                                Text(
                                    text = message.text,
                                    color = if (isUser) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                    style = MaterialTheme.typography.bodyMedium,
                                    lineHeight = 22.sp
                                )
                            }
                        }
                    }
                }
            }

            // Actions row for model messages
            if (!isUser && !isLoading && !isError) {
                Row(
                    modifier = Modifier.padding(top = 4.dp, start = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    onRegenerate?.let { regen ->
                        IconButton(onClick = regen, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Refresh, "Regenerate", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    if (message.tokenCount > 0) {
                        Text(
                            "${message.tokenCount} tokens",
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                            modifier = Modifier.align(Alignment.CenterVertically)
                        )
                    }
                }
            }
        }

        if (isUser) {
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Person, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onPrimaryContainer)
            }
        }
    }
}

@Composable
private fun LoadingDots() {
    var dotCount by remember { mutableStateOf(1) }
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(400)
            dotCount = (dotCount % 3) + 1
        }
    }
    Text(
        ".".repeat(dotCount),
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontFamily = FontFamily.Monospace
    )
}

@Composable
private fun ChatInputBar(
    inputText: String,
    selectedImageUri: Uri?,
    isGenerating: Boolean,
    onTextChange: (String) -> Unit,
    onSendMessage: () -> Unit,
    onAttachImage: () -> Unit,
    onRemoveImage: () -> Unit
) {
    Surface(
        shadowElevation = 8.dp,
        color = MaterialTheme.colorScheme.surface
    ) {
        Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            selectedImageUri?.let { uri ->
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    Icon(Icons.Default.Image, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Image attached", style = MaterialTheme.typography.bodySmall, modifier = Modifier.weight(1f))
                    IconButton(onClick = onRemoveImage, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, null, modifier = Modifier.size(16.dp))
                    }
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Bottom
            ) {
                IconButton(onClick = onAttachImage, enabled = !isGenerating) {
                    Icon(Icons.Default.AttachFile, "Attach image", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                OutlinedTextField(
                    value = inputText,
                    onValueChange = onTextChange,
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Type a message...", color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)) },
                    maxLines = 5,
                    enabled = !isGenerating,
                    shape = RoundedCornerShape(24.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                    )
                )
                Spacer(modifier = Modifier.width(8.dp))
                if (isGenerating) {
                    CircularProgressIndicator(modifier = Modifier.size(40.dp).padding(8.dp))
                } else {
                    IconButton(
                        onClick = onSendMessage,
                        enabled = inputText.isNotBlank() || selectedImageUri != null,
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(
                                if (inputText.isNotBlank() || selectedImageUri != null)
                                    MaterialTheme.colorScheme.primary
                                else MaterialTheme.colorScheme.surfaceVariant
                            )
                    ) {
                        Icon(
                            Icons.Default.Send,
                            "Send",
                            tint = if (inputText.isNotBlank() || selectedImageUri != null)
                                MaterialTheme.colorScheme.onPrimary
                            else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}
