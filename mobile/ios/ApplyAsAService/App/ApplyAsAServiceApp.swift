//
//  ApplyAsAServiceApp.swift
//  ApplyAsAService
//
//  Mobile Application for Job Search and Application Tracking
//  iOS 15.0+ | Swift 5.9 | SwiftUI
//

import SwiftUI

@main
struct ApplyAsAServiceApp: App {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var syncManager = SyncManager()
    @StateObject private var notificationManager = NotificationManager()
    
    init() {
        configureAppearance()
    }
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authManager)
                .environmentObject(syncManager)
                .environmentObject(notificationManager)
                .onAppear {
                    notificationManager.requestAuthorization()
                }
        }
    }
    
    private func configureAppearance() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor.systemBackground
        appearance.titleTextAttributes = [.foregroundColor: UIColor.label]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.label]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        
        UITabBar.appearance().backgroundColor = UIColor.systemBackground
    }
}
