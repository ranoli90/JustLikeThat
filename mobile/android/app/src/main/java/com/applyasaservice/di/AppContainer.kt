package com.applyasaservice.di

import android.content.Context
import com.applyasaservice.service.AuthManager
import com.applyasaservice.service.JobService
import com.applyasaservice.service.ApplicationService
import com.applyasaservice.service.NotificationService
import com.applyasaservice.service.SyncService
import com.applyasaservice.repository.JobRepository
import com.applyasaservice.repository.ApplicationRepository
import com.applyasaservice.repository.UserRepository

/**
 * Manual dependency injection container
 * Provides singleton instances of services and repositories
 */
class AppContainer(private val context: Context) {
    
    // Network
    private val networkClient = createNetworkClient()
    
    // Data stores
    private val dataStore = createDataStore()
    private val secureStorage = createSecureStorage()
    
    // Repositories
    val userRepository: UserRepository by lazy {
        UserRepository(networkClient, dataStore)
    }
    
    val jobRepository: JobRepository by lazy {
        JobRepository(networkClient, dataStore)
    }
    
    val applicationRepository: ApplicationRepository by lazy {
        ApplicationRepository(networkClient, dataStore)
    }
    
    // Services
    val authManager: AuthManager by lazy {
        AuthManager(userRepository, secureStorage)
    }
    
    val jobService: JobService by lazy {
        JobService(jobRepository)
    }
    
    val applicationService: ApplicationService by lazy {
        ApplicationService(applicationRepository)
    }
    
    val notificationService: NotificationService by lazy {
        NotificationService(context)
    }
    
    val syncService: SyncService by lazy {
        SyncService(jobRepository, applicationRepository, dataStore)
    }
    
    // ViewModel factories
    val loginViewModelFactory: viewmodel.LoginViewModelFactory by lazy {
        viewmodel.LoginViewModelFactory(authManager)
    }
    
    val jobSearchViewModelFactory: viewmodel.JobSearchViewModelFactory by lazy {
        viewmodel.JobSearchViewModelFactory(jobService)
    }
    
    val applicationsViewModelFactory: viewmodel.ApplicationsViewModelFactory by lazy {
        viewmodel.ApplicationsViewModelFactory(applicationService)
    }
    
    private fun createNetworkClient(): com.applyasaservice.util.NetworkClient {
        return com.applyasaservice.util.NetworkClient(
            baseUrl = "https://api.applyasaservice.com/api/v1/",
            timeoutSeconds = 30
        )
    }
    
    private fun createDataStore(): com.applyasaservice.util.DataStore {
        return com.applyasaservice.util.DataStore(context)
    }
    
    private fun createSecureStorage(): com.applyasaservice.util.SecureStorage {
        return com.applyasaservice.util.SecureStorage(context)
    }
}

// Package for ViewModel factories (to avoid import issues)
private typealias viewmodel = androidx.lifecycle.viewmodel.compose.viewmodel
