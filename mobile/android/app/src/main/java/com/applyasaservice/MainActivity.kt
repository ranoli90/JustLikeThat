package com.applyasaservice

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.applyasaservice.ui.screens.auth.LoginScreen
import com.applyasaservice.ui.screens.home.HomeScreen
import com.applyasaservice.ui.screens.applications.ApplicationsScreen
import com.applyasaservice.ui.screens.interviewprep.InterviewPrepScreen
import com.applyasaservice.ui.screens.profile.ProfileScreen
import com.applyasaservice.ui.theme.ApplyAsAServiceTheme

/**
 * Main Activity for Apply as a Service Android app
 * Uses Jetpack Compose for UI
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            ApplyAsAServiceTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainApp()
                }
            }
        }
    }
}

/**
 * Main app navigation composable
 */
@Composable
fun MainApp() {
    val navController = rememberNavController()
    val authManager = ApplyAsAServiceApp.instance.appContainer.authManager
    
    NavHost(
        navController = navController,
        startDestination = if (authManager.isAuthenticated) Screen.Home.route else Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                }
            )
        }
        
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToJobDetail = { jobId ->
                    navController.navigate(Screen.JobDetail.createRoute(jobId))
                },
                onNavigateToProfile = {
                    navController.navigate(Screen.Profile.route)
                },
                onLogout = {
                    authManager.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.Applications.route) {
            ApplicationsScreen(
                onNavigateToApplicationDetail = { applicationId ->
                    navController.navigate(Screen.ApplicationDetail.createRoute(applicationId))
                }
            )
        }
        
        composable(Screen.InterviewPrep.route) {
            InterviewPrepScreen(
                onNavigateToMockInterview = { interviewId ->
                    navController.navigate(Screen.MockInterview.createRoute(interviewId))
                }
            )
        }
        
        composable(Screen.Profile.route) {
            ProfileScreen(
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onLogout = {
                    authManager.logout()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }
    }
}

/**
 * Navigation destinations
 */
sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Register : Screen("register")
    data object Home : Screen("home")
    data object JobDetail : Screen("job/{jobId}") {
        fun createRoute(jobId: String) = "job/$jobId"
    }
    data object Applications : Screen("applications")
    data object ApplicationDetail : Screen("application/{applicationId}") {
        fun createRoute(applicationId: String) = "application/$applicationId"
    }
    data object InterviewPrep : Screen("interview_prep")
    data object MockInterview : Screen("mock_interview/{interviewId}") {
        fun createRoute(interviewId: String) = "mock_interview/$interviewId"
    }
    data object Profile : Screen("profile")
    data object Settings : Screen("settings")
}
