package com.uitars.aistudio.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.uitars.aistudio.presentation.auth.AuthViewModel
import com.uitars.aistudio.presentation.auth.LoginScreen
import com.uitars.aistudio.presentation.auth.RegisterScreen
import com.uitars.aistudio.presentation.chat.ChatScreen
import com.uitars.aistudio.presentation.freeform.FreeformScreen
import com.uitars.aistudio.presentation.home.HomeScreen
import com.uitars.aistudio.presentation.settings.ApiKeysScreen
import com.uitars.aistudio.presentation.settings.SettingsScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Chat : Screen("chat/{conversationId}") {
        fun createRoute(conversationId: String) = "chat/$conversationId"
    }
    object Freeform : Screen("freeform/{conversationId}") {
        fun createRoute(conversationId: String) = "freeform/$conversationId"
    }
    object Settings : Screen("settings")
    object ApiKeys : Screen("api_keys")
}

@Composable
fun AIStudioNavGraph() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()

    NavHost(
        navController = navController,
        startDestination = if (isLoggedIn) Screen.Home.route else Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onNavigateToRegister = { navController.navigate(Screen.Register.route) },
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                onNavigateToLogin = { navController.popBackStack() },
                onRegisterSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToChat = { convId ->
                    navController.navigate(Screen.Chat.createRoute(convId))
                },
                onNavigateToFreeform = { convId ->
                    navController.navigate(Screen.Freeform.createRoute(convId))
                },
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                onNavigateToApiKeys = { navController.navigate(Screen.ApiKeys.route) },
                onSignOut = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.Chat.route,
            arguments = listOf(navArgument("conversationId") { type = NavType.StringType })
        ) { backStackEntry ->
            val convId = backStackEntry.arguments?.getString("conversationId") ?: ""
            ChatScreen(
                conversationId = convId,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) }
            )
        }

        composable(
            route = Screen.Freeform.route,
            arguments = listOf(navArgument("conversationId") { type = NavType.StringType })
        ) { backStackEntry ->
            val convId = backStackEntry.arguments?.getString("conversationId") ?: ""
            FreeformScreen(
                conversationId = convId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onNavigateToApiKeys = { navController.navigate(Screen.ApiKeys.route) }
            )
        }

        composable(Screen.ApiKeys.route) {
            ApiKeysScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
