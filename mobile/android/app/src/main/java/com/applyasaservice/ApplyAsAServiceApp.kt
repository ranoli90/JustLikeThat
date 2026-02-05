package com.applyasaservice

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.applyasaservice.di.AppContainer

/**
 * Apply as a Service - Android Application
 * Main application class for initialization
 */
class ApplyAsAServiceApp : Application() {
    
    lateinit var appContainer: AppContainer
        private set
    
    override fun onCreate() {
        super.onCreate()
        instance = this
        
        // Initialize dependency injection container
        appContainer = AppContainer(this)
        
        // Create notification channels
        createNotificationChannels()
        
        // Initialize Firebase
        initializeFirebase()
    }
    
    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(NotificationManager::class.java)
            
            // Job matches channel
            val jobMatchesChannel = NotificationChannel(
                CHANNEL_JOB_MATCHES,
                "Job Matches",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications about new job matches"
            }
            
            // Application updates channel
            val applicationUpdatesChannel = NotificationChannel(
                CHANNEL_APPLICATION_UPDATES,
                "Application Updates",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Updates on your job applications"
            }
            
            // Interview reminders channel
            val interviewRemindersChannel = NotificationChannel(
                CHANNEL_INTERVIEW_REMINDERS,
                "Interview Reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Reminders for upcoming interviews"
                enableVibration(true)
            }
            
            // Messages channel
            val messagesChannel = NotificationChannel(
                CHANNEL_MESSAGES,
                "Messages",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Messages from recruiters"
            }
            
            // System notifications channel
            val systemChannel = NotificationChannel(
                CHANNEL_SYSTEM,
                "System Notifications",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "General app notifications"
            }
            
            notificationManager.createNotificationChannels(
                listOf(
                    jobMatchesChannel,
                    applicationUpdatesChannel,
                    interviewRemindersChannel,
                    messagesChannel,
                    systemChannel
                )
            )
        }
    }
    
    private fun initializeFirebase() {
        // Firebase initialization is handled by Google Services plugin
    }
    
    companion object {
        const val CHANNEL_JOB_MATCHES = "job_matches"
        const val CHANNEL_APPLICATION_UPDATES = "application_updates"
        const val CHANNEL_INTERVIEW_REMINDERS = "interview_reminders"
        const val CHANNEL_MESSAGES = "messages"
        const val CHANNEL_SYSTEM = "system"
        
        lateinit var instance: ApplyAsAServiceApp
            private set
    }
}
