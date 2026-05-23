package com.uitars.aistudio.presentation.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Google AI Studio color palette
val GoogleBlue = Color(0xFF1A73E8)
val GoogleBlueDark = Color(0xFF4285F4)
val GoogleGreen = Color(0xFF34A853)
val GoogleRed = Color(0xFFEA4335)
val GoogleYellow = Color(0xFFFBBC05)
val SurfaceDark = Color(0xFF1C1B1F)
val SurfaceVariantDark = Color(0xFF2D2C31)
val CardDark = Color(0xFF252427)
val SidebarDark = Color(0xFF1E1E24)

private val DarkColorScheme = darkColorScheme(
    primary = GoogleBlueDark,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF0D47A1),
    onPrimaryContainer = Color(0xFFD3E3FD),
    secondary = GoogleGreen,
    onSecondary = Color.White,
    tertiary = GoogleYellow,
    background = Color(0xFF13131A),
    onBackground = Color(0xFFE3E3E8),
    surface = SurfaceDark,
    onSurface = Color(0xFFE3E3E8),
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = Color(0xFFCAC4D0),
    outline = Color(0xFF49454F),
    error = GoogleRed,
    onError = Color.White
)

private val LightColorScheme = lightColorScheme(
    primary = GoogleBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFD3E3FD),
    onPrimaryContainer = Color(0xFF001D35),
    secondary = GoogleGreen,
    onSecondary = Color.White,
    tertiary = Color(0xFF8C4504),
    background = Color(0xFFF8F9FA),
    onBackground = Color(0xFF202124),
    surface = Color.White,
    onSurface = Color(0xFF202124),
    surfaceVariant = Color(0xFFF1F3F4),
    onSurfaceVariant = Color(0xFF5F6368),
    outline = Color(0xFFDADCE0),
    error = GoogleRed,
    onError = Color.White
)

@Composable
fun AIStudioTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
