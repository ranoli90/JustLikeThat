package com.applyasaservice.service

import com.applyasaservice.repository.UserRepository
import com.applyasaservice.util.SecureStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Authentication manager for handling user login/logout
 * Uses OAuth2 flow with token refresh
 */
class AuthManager(
    private val userRepository: UserRepository,
    private val secureStorage: SecureStorage
) {
    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()
    
    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()
    
    val isAuthenticated: Boolean
        get() = secureStorage.getAccessToken() != null
    
    suspend fun login(email: String, password: String): Result<User> {
        _authState.value = AuthState.Loading
        
        return try {
            val response = userRepository.login(email, password)
            secureStorage.saveAccessToken(response.accessToken)
            secureStorage.saveRefreshToken(response.refreshToken)
            secureStorage.saveTokenExpiry(response.expiresAt)
            
            _currentUser.value = response.user
            _authState.value = AuthState.Authenticated
            
            Result.success(response.user)
        } catch (e: Exception) {
            _authState.value = AuthState.Error(e.message ?: "Login failed")
            Result.failure(e)
        }
    }
    
    suspend fun register(
        email: String,
        password: String,
        firstName: String,
        lastName: String
    ): Result<User> {
        _authState.value = AuthState.Loading
        
        return try {
            val response = userRepository.register(email, password, firstName, lastName)
            secureStorage.saveAccessToken(response.accessToken)
            secureStorage.saveRefreshToken(response.refreshToken)
            secureStorage.saveTokenExpiry(response.expiresAt)
            
            _currentUser.value = response.user
            _authState.value = AuthState.Authenticated
            
            Result.success(response.user)
        } catch (e: Exception) {
            _authState.value = AuthState.Error(e.message ?: "Registration failed")
            Result.failure(e)
        }
    }
    
    suspend fun logout() {
        try {
            userRepository.logout()
        } catch (e: Exception) {
            // Ignore logout API errors
        }
        
        secureStorage.clearTokens()
        _currentUser.value = null
        _authState.value = AuthState.Idle
    }
    
    suspend fun refreshTokenIfNeeded(): Boolean {
        val expiry = secureStorage.getTokenExpiry()
        if (expiry == null || expiry > System.currentTimeMillis()) {
            return true
        }
        
        val refreshToken = secureStorage.getRefreshToken() ?: return false
        
        return try {
            val response = userRepository.refreshToken(refreshToken)
            secureStorage.saveAccessToken(response.accessToken)
            secureStorage.saveRefreshToken(response.refreshToken)
            secureStorage.saveTokenExpiry(response.expiresAt)
            true
        } catch (e: Exception) {
            logout()
            false
        }
    }
    
    fun getAccessToken(): String? = secureStorage.getAccessToken()
}

/**
 * Authentication state
 */
sealed class AuthState {
    data object Idle : AuthState()
    data object Loading : AuthState()
    data object Authenticated : AuthState()
    data class Error(val message: String) : AuthState()
}

/**
 * User data class
 */
data class User(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val avatarUrl: String?,
    val createdAt: Long,
    val updatedAt: Long
) {
    val fullName: String get() = "$firstName $lastName"
}

/**
 * Auth response from API
 */
data class AuthResponse(
    val user: User,
    val accessToken: String,
    val refreshToken: String,
    val expiresAt: Long
)
