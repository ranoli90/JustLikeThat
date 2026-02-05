//
//  NotificationManager.swift
//  ApplyAsAService
//
//  Push notification handling and management
//

import Foundation
import UserNotifications
import UIKit
import os.log

// MARK: - Notification ManagerManager: ObservableObject

final class Notification {
    static let shared = NotificationManager()
    
    @Published private(set) var isAuthorized = false
    @Published private(set) var deviceToken: String?
    @Published private(set) var notifications: [PushNotification] = []
    @Published private(set) var unreadCount = 0
    
    private let center = UNUserNotificationCenter.current()
    private let userDefaults = UserDefaults.standard
    
    private let deviceTokenKey = "deviceToken"
    private let notificationsKey = "cachedNotifications"
    
    private init() {
        checkAuthorizationStatus()
        loadCachedNotifications()
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() {
        let options: UNAuthorizationOptions = [.alert, .badge, .sound]
        
        center.requestAuthorization(options: options) { [weak self] granted, error in
            DispatchQueue.main.async {
                self?.isAuthorized = granted
                
                if granted {
                    self?.registerForRemoteNotifications()
                }
                
                if let error = error {
                    os_log("Notification authorization error: %{public}@", log: .default, type: .error, error.localizedDescription)
                }
            }
        }
    }
    
    private func checkAuthorizationStatus() {
        center.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.isAuthorized = settings.authorizationStatus == .authorized
            }
        }
    }
    
    private func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    // MARK: - Device Token
    
    func registerDeviceToken(_ token: String, platform: String) async {
        await MainActor.run {
            self.deviceToken = token
            self.userDefaults.set(token, forKey: deviceTokenKey)
        }
        
        // Register with backend
        let endpoint = MobileEndpoint.registerDevice(token: token, platform: platform)
        
        do {
            let _: DeviceRegistrationResponse = try await NetworkService.shared.request(endpoint)
            print("Device registered successfully")
        } catch {
            print("Failed to register device: \(error)")
            // Retry logic could be added here
        }
    }
    
    func registerFCMToken(_ fcmToken: String) async {
        await registerDeviceToken(fcmToken, platform: "ios")
    }
    
    // MARK: - Notification Handling
    
    func handleNotificationTap(_ userInfo: [AnyHashable: Any]) async {
        guard let typeString = userInfo["type"] as? String,
              let type = NotificationType(rawValue: typeString) else {
            return
        }
        
        let data: [String: String] = userInfo.compactMapValues { "\($0)" }
        
        await MainActor {
            NotificationCenter.default.post(
                name: .didReceiveNotificationTap,
                object: nil,
                userInfo: ["type": type, "data": data]
            )
        }
    }
    
    // MARK: - Notification Management
    
    func fetchNotifications(page: Int = 1, limit: Int = 20) async throws {
        let endpoint = MobileEndpoint.getNotifications(page: page, limit: limit)
        let response: PaginatedResponse<PushNotification> = try await NetworkService.shared.request(endpoint)
        
        await MainActor.run {
            if page == 1 {
                notifications = response.items
            } else {
                notifications.append(contentsOf: response.items)
            }
            unreadCount = notifications.filter { !$0.read }.count
        }
        
        cacheNotifications()
    }
    
    func markNotificationRead(_ id: String) async {
        do {
            let endpoint = MobileEndpoint.markNotificationRead(id: id)
            try await NetworkService.shared.requestVoid(endpoint)
            
            await MainActor.run {
                if let index = notifications.firstIndex(where: { $0.id == id }) {
                    notifications[index].read = true
                    unreadCount = max(0, unreadCount - 1)
                }
            }
            
            cacheNotifications()
        } catch {
            print("Failed to mark notification as read: \(error)")
        }
    }
    
    func markAllNotificationsRead() async {
        do {
            let endpoint = MobileEndpoint.markAllNotificationsRead
            try await NetworkService.shared.requestVoid(endpoint)
            
            await MainActor.run {
                for index in notifications.indices {
                    notifications[index].read = true
                }
                unreadCount = 0
            }
            
            cacheNotifications()
        } catch {
            print("Failed to mark all notifications as read: \(error)")
        }
    }
    
    // MARK: - Notification Preferences
    
    func getNotificationPreferences() async throws -> NotificationPreferences {
        let endpoint = MobileEndpoint.getNotificationPreferences
        return try await NetworkService.shared.request(endpoint)
    }
    
    func updateNotificationPreferences(_ preferences: NotificationPreferences) async throws {
        let endpoint = MobileEndpoint.updateNotificationPreferences(preferences: preferences)
        _ = try await NetworkService.shared.request(endpoint)
    }
    
    // MARK: - Badge Management
    
    func updateBadgeCount(_ count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }
    
    func clearBadge() {
        updateBadgeCount(0)
    }
    
    // MARK: - Caching
    
    private func loadCachedNotifications() {
        guard let data = userDefaults.data(forKey: notificationsKey),
              let cached = try? JSONDecoder().decode([PushNotification].self, from: data) else {
            return
        }
        
        notifications = cached
        unreadCount = cached.filter { !$0.read }.count
    }
    
    private func cacheNotifications() {
        guard let data = try? JSONEncoder().encode(notifications) else { return }
        userDefaults.set(data, forKey: notificationsKey)
    }
    
    // MARK: - Local Notifications
    
    func scheduleLocalNotification(
        title: String,
        body: String,
        identifier: String,
        after interval: TimeInterval = 0
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let trigger: UNNotificationTrigger?
        if interval > 0 {
            trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        } else {
            trigger = nil
        }
        
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        
        center.add(request) { error in
            if let error = error {
                print("Failed to schedule notification: \(error)")
            }
        }
    }
    
    func scheduleInterviewReminder(
        interviewId: String,
        title: String,
        body: String,
        at date: Date
    ) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = [
            "type": NotificationType.interviewReminder.rawValue,
            "interviewId": interviewId
        ]
        
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: date)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        
        let identifier = "interview-\(interviewId)"
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        
        center.add(request) { error in
            if let error = error {
                print("Failed to schedule interview reminder: \(error)")
            }
        }
    }
    
    func cancelLocalNotification(identifier: String) {
        center.removePendingNotificationRequests(withIdentifiers: [identifier])
    }
    
    func cancelAllLocalNotifications() {
        center.removeAllPendingNotificationRequests()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let didReceiveNotificationTap = Notification.Name("didReceiveNotificationTap")
}

// MARK: - Response Types

struct DeviceRegistrationResponse: Codable {
    let deviceId: String
    let registeredAt: Date
}
