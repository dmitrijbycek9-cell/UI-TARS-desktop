package com.uitars.aistudio.presentation.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.uitars.aistudio.data.model.ConversationEntity
import com.uitars.aistudio.data.model.GeminiModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToChat: (String) -> Unit,
    onNavigateToFreeform: (String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToApiKeys: () -> Unit,
    onSignOut: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val conversations by viewModel.conversations.collectAsState()
    val selectedModel by viewModel.selectedModel.collectAsState()
    val user = viewModel.authRepository.currentUser
    var showModelPicker by remember { mutableStateOf(false) }
    var showUserMenu by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "AI Studio",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            " by Google",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToApiKeys) {
                        Icon(Icons.Default.Key, "API Keys")
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(Icons.Default.Settings, "Settings")
                    }
                    Box {
                        IconButton(onClick = { showUserMenu = true }) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primary),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    user?.displayName?.firstOrNull()?.uppercase() ?: "U",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                        }
                        DropdownMenu(
                            expanded = showUserMenu,
                            onDismissRequest = { showUserMenu = false }
                        ) {
                            user?.let {
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(it.displayName, fontWeight = FontWeight.Medium)
                                            Text(it.email, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    },
                                    onClick = {}
                                )
                                Divider()
                            }
                            DropdownMenuItem(
                                text = { Text("Sign Out") },
                                leadingIcon = { Icon(Icons.Default.Logout, null) },
                                onClick = {
                                    showUserMenu = false
                                    viewModel.signOut()
                                    onSignOut()
                                }
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Model selector
            item {
                ModelSelector(
                    selectedModel = selectedModel,
                    models = viewModel.availableModels,
                    showPicker = showModelPicker,
                    onTogglePicker = { showModelPicker = !showModelPicker },
                    onModelSelected = {
                        viewModel.selectModel(it)
                        showModelPicker = false
                    }
                )
            }

            // Quick actions
            item {
                Text(
                    "Start a new session",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    QuickActionCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Chat,
                        title = "Chat",
                        description = "Multi-turn conversations",
                        color = Color(0xFF1A73E8),
                        onClick = { viewModel.createChatConversation(onNavigateToChat) }
                    )
                    QuickActionCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Edit,
                        title = "Freeform",
                        description = "Single prompt mode",
                        color = Color(0xFF34A853),
                        onClick = { viewModel.createFreeformConversation(onNavigateToFreeform) }
                    )
                }
            }

            // Recent conversations
            if (conversations.isNotEmpty()) {
                item {
                    Text(
                        "Recent",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                items(conversations, key = { it.id }) { conv ->
                    ConversationCard(
                        conversation = conv,
                        onClick = {
                            if (conv.mode == "CHAT") onNavigateToChat(conv.id)
                            else onNavigateToFreeform(conv.id)
                        },
                        onDelete = { showDeleteConfirm = conv.id }
                    )
                }
            } else {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.AutoAwesome,
                                null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "No conversations yet",
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                "Start a new chat or freeform prompt",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // Delete confirmation dialog
    showDeleteConfirm?.let { convId ->
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Delete Conversation") },
            text = { Text("This conversation and all its messages will be permanently deleted.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteConversation(convId)
                        showDeleteConfirm = null
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text("Delete") }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = null }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun ModelSelector(
    selectedModel: GeminiModel,
    models: List<GeminiModel>,
    showPicker: Boolean,
    onTogglePicker: () -> Unit,
    onModelSelected: (GeminiModel) -> Unit
) {
    Column {
        OutlinedCard(
            onClick = onTogglePicker,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.AutoAwesome,
                    null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        selectedModel.displayName,
                        fontWeight = FontWeight.SemiBold,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        "${selectedModel.inputTokenLimit / 1000}K context window",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Icon(
                    if (showPicker) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        if (showPicker) {
            Card(
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                models.forEach { model ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onModelSelected(model) }
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (model.id == selectedModel.id) {
                            Icon(Icons.Default.Check, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                        } else {
                            Spacer(modifier = Modifier.size(20.dp))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(model.displayName, fontWeight = FontWeight.Medium)
                            Text(model.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickActionCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    title: String,
    description: String,
    color: Color,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.12f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(color.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(22.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
            Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun ConversationCard(
    conversation: ConversationEntity,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    val dateFormat = SimpleDateFormat("MMM d, HH:mm", Locale.getDefault())

    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(
                        if (conversation.mode == "CHAT") Color(0xFF1A73E8).copy(alpha = 0.15f)
                        else Color(0xFF34A853).copy(alpha = 0.15f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (conversation.mode == "CHAT") Icons.Default.Chat else Icons.Default.Edit,
                    null,
                    tint = if (conversation.mode == "CHAT") Color(0xFF1A73E8) else Color(0xFF34A853),
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(conversation.title, fontWeight = FontWeight.Medium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        conversation.modelId.replace("gemini-", "").replace("-", " "),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text("·", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
                    Text(
                        dateFormat.format(Date(conversation.updatedAt)),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
            }
        }
    }
}
