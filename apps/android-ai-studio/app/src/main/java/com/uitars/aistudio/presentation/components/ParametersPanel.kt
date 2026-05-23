package com.uitars.aistudio.presentation.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.uitars.aistudio.data.model.GeminiModel
import com.uitars.aistudio.data.model.ModelParameters
import kotlin.math.roundToInt

@Composable
fun ParametersPanel(
    params: ModelParameters,
    availableModels: List<GeminiModel>,
    selectedModelId: String,
    onParamsChanged: (ModelParameters) -> Unit,
    onModelChanged: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var temperature by remember { mutableStateOf(params.temperature) }
    var topP by remember { mutableStateOf(params.topP) }
    var topK by remember { mutableStateOf(params.topK.toFloat()) }
    var maxTokens by remember { mutableStateOf(params.maxOutputTokens.toFloat()) }
    var showModelPicker by remember { mutableStateOf(false) }
    val selectedModel = availableModels.find { it.id == selectedModelId } ?: availableModels.first()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 16.dp)
    ) {
        Text("Parameters", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(20.dp))

        // Model
        Text("Model", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedCard(
            onClick = { showModelPicker = !showModelPicker },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(selectedModel.displayName, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                Text("▼", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        if (showModelPicker) {
            Card(modifier = Modifier.fillMaxWidth().padding(top = 4.dp)) {
                availableModels.forEach { model ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onModelChanged(model.id)
                                showModelPicker = false
                            }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (model.id == selectedModelId) {
                            Icon(Icons.Default.Check, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                        } else {
                            Spacer(Modifier.size(16.dp))
                        }
                        Spacer(Modifier.width(8.dp))
                        Text(model.displayName, style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Temperature
        SliderParam(
            label = "Temperature",
            value = temperature,
            valueRange = 0f..2f,
            description = "Controls randomness. Lower = more focused, Higher = more creative",
            displayValue = { String.format("%.2f", it) },
            onValueChange = {
                temperature = it
                onParamsChanged(ModelParameters(temperature, topP, topK.roundToInt(), maxTokens.roundToInt()))
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Top P
        SliderParam(
            label = "Top P",
            value = topP,
            valueRange = 0f..1f,
            description = "Nucleus sampling. Considers tokens up to this cumulative probability",
            displayValue = { String.format("%.2f", it) },
            onValueChange = {
                topP = it
                onParamsChanged(ModelParameters(temperature, topP, topK.roundToInt(), maxTokens.roundToInt()))
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Top K
        SliderParam(
            label = "Top K",
            value = topK,
            valueRange = 1f..100f,
            steps = 99,
            description = "Number of highest probability tokens to consider",
            displayValue = { it.roundToInt().toString() },
            onValueChange = {
                topK = it
                onParamsChanged(ModelParameters(temperature, topP, topK.roundToInt(), maxTokens.roundToInt()))
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Max output tokens
        SliderParam(
            label = "Output token limit",
            value = maxTokens,
            valueRange = 256f..8192f,
            description = "Maximum number of tokens in the response",
            displayValue = { it.roundToInt().toString() },
            onValueChange = {
                maxTokens = it
                onParamsChanged(ModelParameters(temperature, topP, topK.roundToInt(), maxTokens.roundToInt()))
            }
        )

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            OutlinedButton(onClick = {
                temperature = 0.7f
                topP = 0.95f
                topK = 40f
                maxTokens = 8192f
                onParamsChanged(ModelParameters(0.7f, 0.95f, 40, 8192))
            }) { Text("Reset to Defaults") }
            Button(onClick = onDismiss) { Text("Done") }
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
private fun SliderParam(
    label: String,
    value: Float,
    valueRange: ClosedFloatingPointRange<Float>,
    steps: Int = 0,
    description: String,
    displayValue: (Float) -> String,
    onValueChange: (Float) -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Medium)
            Surface(
                shape = RoundedCornerShape(4.dp),
                color = MaterialTheme.colorScheme.primaryContainer
            ) {
                Text(
                    displayValue(value),
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = valueRange,
            steps = steps,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            description,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
