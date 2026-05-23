package com.uitars.aistudio.presentation.settings

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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToApiKeys: () -> Unit
) {
    var streamingEnabled by remember { mutableStateOf(true) }
    var safeModeEnabled by remember { mutableStateOf(false) }
    var autoTitleEnabled by remember { mutableStateOf(true) }
    var darkModeEnabled by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
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
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // API section
            SettingsSectionHeader("API Configuration")
            SettingsNavigationItem(
                icon = Icons.Default.Key,
                title = "API Keys",
                subtitle = "Manage your Gemini API keys",
                onClick = onNavigateToApiKeys
            )
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Behavior
            SettingsSectionHeader("Behavior")
            SettingsToggleItem(
                icon = Icons.Default.Stream,
                title = "Streaming responses",
                subtitle = "Show responses as they generate",
                checked = streamingEnabled,
                onCheckedChange = { streamingEnabled = it }
            )
            SettingsToggleItem(
                icon = Icons.Default.Title,
                title = "Auto-generate titles",
                subtitle = "Automatically title conversations",
                checked = autoTitleEnabled,
                onCheckedChange = { autoTitleEnabled = it }
            )
            SettingsToggleItem(
                icon = Icons.Default.Shield,
                title = "Safety filtering",
                subtitle = "Block potentially harmful content",
                checked = safeModeEnabled,
                onCheckedChange = { safeModeEnabled = it }
            )
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Appearance
            SettingsSectionHeader("Appearance")
            SettingsToggleItem(
                icon = Icons.Default.DarkMode,
                title = "Dark mode",
                subtitle = "Use dark color scheme",
                checked = darkModeEnabled,
                onCheckedChange = { darkModeEnabled = it }
            )
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // About
            SettingsSectionHeader("About")
            SettingsInfoItem(
                icon = Icons.Default.Info,
                title = "Version",
                value = "1.0.0"
            )
            SettingsInfoItem(
                icon = Icons.Default.Android,
                title = "Platform",
                value = "Android"
            )
            SettingsInfoItem(
                icon = Icons.Default.Link,
                title = "Powered by",
                value = "Google Gemini API"
            )

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Google AI Studio", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                    Text(
                        "This app connects to the Gemini API. Your conversations are stored locally and optionally synced via Firebase.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun SettingsSectionHeader(title: String) {
    Text(
        title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(vertical = 4.dp)
    )
}

@Composable
private fun SettingsNavigationItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Medium)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun SettingsToggleItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Medium)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Switch(checked = checked, onCheckedChange = onCheckedChange)
        }
    }
}

@Composable
private fun SettingsInfoItem(
    icon: ImageVector,
    title: String,
    value: String
) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, modifier = Modifier.weight(1f))
        Text(value, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
    }
}
