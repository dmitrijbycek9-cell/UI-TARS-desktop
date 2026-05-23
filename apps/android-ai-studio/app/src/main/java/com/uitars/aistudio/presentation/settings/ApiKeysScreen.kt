package com.uitars.aistudio.presentation.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.uitars.aistudio.data.model.ApiKeyEntity
import com.uitars.aistudio.presentation.apikeys.ApiKeysViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApiKeysScreen(
    onNavigateBack: () -> Unit,
    viewModel: ApiKeysViewModel = hiltViewModel()
) {
    val apiKeys by viewModel.apiKeys.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var deleteKey by remember { mutableStateOf<ApiKeyEntity?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("API Keys", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(Icons.Default.Add, "Add API Key")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Info card
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.Top) {
                    Icon(
                        Icons.Default.Info,
                        null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Get your API key", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                        Text(
                            "Visit aistudio.google.com → Get API key to create a free Gemini API key.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (apiKeys.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.Key,
                            null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No API keys", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(
                            "Add a Gemini API key to start chatting",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { showAddDialog = true }) {
                            Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Add API Key")
                        }
                    }
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(apiKeys, key = { it.id }) { key ->
                        ApiKeyCard(
                            apiKey = key,
                            onActivate = { viewModel.activateKey(key.id) },
                            onDelete = { deleteKey = key }
                        )
                    }
                }
            }
        }
    }

    // Add API Key dialog
    if (showAddDialog) {
        AddApiKeyDialog(
            onDismiss = { showAddDialog = false },
            onConfirm = { name, keyValue ->
                viewModel.addApiKey(name, keyValue)
                showAddDialog = false
            }
        )
    }

    // Delete confirmation
    deleteKey?.let { key ->
        AlertDialog(
            onDismissRequest = { deleteKey = null },
            title = { Text("Delete API Key") },
            text = { Text("Delete \"${key.name}\"? This cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.deleteApiKey(key)
                        deleteKey = null
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text("Delete") }
            },
            dismissButton = {
                TextButton(onClick = { deleteKey = null }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun ApiKeyCard(
    apiKey: ApiKeyEntity,
    onActivate: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        border = if (apiKey.isActive) androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.Key,
                    null,
                    tint = if (apiKey.isActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(apiKey.name, fontWeight = FontWeight.SemiBold)
                    if (apiKey.isActive) {
                        Text(
                            "Active",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                if (!apiKey.isActive) {
                    TextButton(onClick = onActivate) { Text("Activate") }
                }
                IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Delete, null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "••••••••" + apiKey.keyValue.takeLast(4),
                fontFamily = FontFamily.Monospace,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun AddApiKeyDialog(
    onDismiss: () -> Unit,
    onConfirm: (name: String, key: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var keyValue by remember { mutableStateOf("") }
    var keyVisible by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add API Key") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Key name") },
                    placeholder = { Text("e.g. My Gemini Key") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = keyValue,
                    onValueChange = { keyValue = it },
                    label = { Text("API Key") },
                    placeholder = { Text("AIza...") },
                    visualTransformation = if (keyVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { keyVisible = !keyVisible }) {
                            Icon(
                                if (keyVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                null
                            )
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    supportingText = { Text("Starts with 'AIza'", style = MaterialTheme.typography.bodySmall) }
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(name.ifBlank { "API Key" }, keyValue) },
                enabled = keyValue.isNotBlank()
            ) { Text("Add") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
