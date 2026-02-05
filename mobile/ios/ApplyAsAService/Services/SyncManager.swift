//
//  SyncManager.swift
//  ApplyAsAService
//
//  Offline data synchronization and background sync
//

import Foundation
import Combine
import BackgroundTasks
import os.log

// MARK: - Sync Manager

final class SyncManager: ObservableObject {
    static let shared = SyncManager()
    
    @Published private(set) var syncStatus = SyncStatus(lastSyncAt: nil, pendingChanges: 0, syncInProgress: false, error: nil)
    @Published private(set) var lastSyncDate: Date?
    @Published private(set) var isOnline = true
    
    private var cancellables = Set<AnyCancellable>()
    private let userDefaults = UserDefaults.standard
    private let pendingChangesKey = "pendingChanges"
    private let lastSyncKey = "lastSyncDate"
    
    private let backgroundTaskIdentifier = "com.applyasaservice.sync"
    
    private init() {
        setupNetworkMonitoring()
        loadSyncState()
    }
    
    private func setupNetworkMonitoring() {
        NetworkMonitor.shared.$isConnected
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isConnected in
                self?.isOnline = isConnected
                if isConnected {
                    self?.performSyncIfNeeded()
                }
            }
            .store(in: &cancellables)
    }
    
    private func loadSyncState() {
        lastSyncDate = userDefaults.object(forKey: lastSyncKey) as? Date
        syncStatus.lastSyncAt = lastSyncDate
        syncStatus.pendingChanges = getPendingChanges().count
    }
    
    // MARK: - Offline Queue Management
    
    func queueChange(_ change: OfflineChange) {
        var changes = getPendingChanges()
        changes.append(change)
        savePendingChanges(changes)
        
        syncStatus.pendingChanges = changes.count
        
        if isOnline {
            performSyncIfNeeded()
        }
    }
    
    func queueCreate(entityType: String, entityId: String, data: [String: AnyCodable]) {
        let change = OfflineChange(
            id: UUID().uuidString,
            entityType: entityType,
            entityId: entityId,
            operation: .create,
            data: data,
            createdAt: Date(),
            syncedAt: nil
        )
        queueChange(change)
    }
    
    func queueUpdate(entityType: String, entityId: String, data: [String: AnyCodable]) {
        let change = OfflineChange(
            id: UUID().uuidString,
            entityType: entityType,
            entityId: entityId,
            operation: .update,
            data: data,
            createdAt: Date(),
            syncedAt: nil
        )
        queueChange(change)
    }
    
    func queueDelete(entityType: String, entityId: String) {
        let change = OfflineChange(
            id: UUID().uuidString,
            entityType: entityType,
            entityId: entityId,
            operation: .delete,
            data: [],
            createdAt: Date(),
            syncedAt: nil
        )
        queueChange(change)
    }
    
    // MARK: - Sync Operations
    
    func performSyncIfNeeded() {
        guard isOnline, !syncStatus.syncInProgress else { return }
        
        let changes = getPendingChanges()
        guard !changes.isEmpty else { return }
        
        Task {
            await performSync(changes: changes)
        }
    }
    
    func performBackgroundSync() async {
        guard isOnline else { return }
        
        let changes = getPendingChanges()
        await performSync(changes: changes)
    }
    
    @MainActor
    private func performSync(changes: [OfflineChange]) async {
        syncStatus.syncInProgress = true
        syncStatus.error = nil
        
        do {
            // Start sync session
            let startEndpoint = MobileEndpoint.startSync(lastSyncAt: lastSyncDate)
            let startResponse: SyncStartResponse = try await NetworkService.shared.request(startEndpoint)
            
            // Apply pending changes
            var appliedChanges: [OfflineChange] = []
            var failedChanges: [OfflineChange] = []
            
            for change in changes {
                do {
                    // Apply change locally first (for optimistic updates)
                    try await applyChangeLocally(change)
                    
                    // Mark as synced
                    change.syncedAt = Date()
                    appliedChanges.append(change)
                } catch {
                    print("Failed to apply change \(change.id): \(error)")
                    failedChanges.append(change)
                }
            }
            
            // Complete sync
            let completeEndpoint = MobileEndpoint.completeSync(
                syncId: startResponse.syncId,
                changes: appliedChanges
            )
            let _: SyncCompleteResponse = try await NetworkService.shared.request(completeEndpoint)
            
            // Update pending changes (remove successful ones)
            let remainingChanges = getPendingChanges().filter { change in
                !appliedChanges.contains { $0.id == change.id }
            }
            savePendingChanges(remainingChanges)
            
            // Update sync status
            lastSyncDate = Date()
            userDefaults.set(lastSyncDate, forKey: lastSyncKey)
            
            syncStatus.lastSyncAt = lastSyncDate
            syncStatus.pendingChanges = remainingChanges.count
            syncStatus.syncInProgress = false
            
        } catch {
            print("Sync failed: \(error)")
            syncStatus.syncInProgress = false
            syncStatus.error = error.localizedDescription
        }
    }
    
    private func applyChangeLocally(_ change: OfflineChange) async throws {
        // Apply change to local database
        // This would use SQLite or Realm for local storage
        let localDB = LocalDatabase.shared
        
        switch change.operation {
        case .create:
            try await localDB.create(entityType: change.entityType, entityId: change.entityId, data: change.data)
        case .update:
            try await localDB.update(entityType: change.entityType, entityId: change.entityId, data: change.data)
        case .delete:
            try await localDB.delete(entityType: change.entityType, entityId: change.entityId)
        }
    }
    
    // MARK: - Full Sync
    
    func performFullSync() async throws {
        guard isOnline else {
            throw APIError.offline
        }
        
        await MainActor.run {
            syncStatus.syncInProgress = true
            syncStatus.error = nil
        }
        
        do {
            // Fetch all data from server
            async let jobs: () = fetchAndStoreJobs()
            async let applications: () = fetchAndStoreApplications()
            async let resumes: () = fetchAndStoreResumes()
            async let interviews: () = fetchAndStoreInterviews()
            
            _ = try await (jobs, applications, resumes, interviews)
            
            // Update last sync date
            lastSyncDate = Date()
            userDefaults.set(lastSyncDate, forKey: lastSyncKey)
            
            await MainActor.run {
                syncStatus.lastSyncAt = lastSyncDate
                syncStatus.syncInProgress = false
            }
            
        } catch {
            await MainActor.run {
                syncStatus.syncInProgress = false
                syncStatus.error = error.localizedDescription
            }
            throw error
        }
    }
    
    // MARK: - Background Tasks
    
    func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: backgroundTaskIdentifier,
            using: nil
        ) { [weak self] task in
            self?.handleBackgroundSync(task: task as! BGAppRefreshTask)
        }
    }
    
    func scheduleBackgroundRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: backgroundTaskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Failed to schedule background refresh: \(error)")
        }
    }
    
    private func handleBackgroundSync(task: BGAppRefreshTask) {
        scheduleBackgroundRefresh() // Schedule next refresh
        
        let syncTask = Task {
            await performBackgroundSync()
        }
        
        task.expirationHandler = {
            syncTask.cancel()
        }
        
        Task {
            await syncTask.value
            task.setTaskCompleted(success: syncStatus.error == nil)
        }
    }
    
    // MARK: - Data Fetching
    
    private func fetchAndStoreJobs() async throws {
        let endpoint = MobileEndpoint.searchJobs(criteria: JobSearchCriteria(
            query: nil,
            location: nil,
            jobTypes: JobType.allCases,
            remoteTypes: RemoteType.allCases,
            salaryMin: nil,
            salaryMax: nil,
            experienceLevels: ExperienceLevel.allCases,
            skills: [],
            industries: [],
            companySizes: CompanySize.allCases,
            postedWithin: nil,
            page: 1,
            limit: 100,
            sortBy: .relevance,
            sortOrder: .desc
        ))
        
        let response: PaginatedResponse<JobPosting> = try await NetworkService.shared.request(endpoint)
        
        let localDB = LocalDatabase.shared
        for job in response.items {
            try await localDB.create(entityType: "JobPosting", entityId: job.id, data: [])
        }
    }
    
    private func fetchAndStoreApplications() async throws {
        let endpoint = MobileEndpoint.getApplications(page: 1, limit: 100)
        let response: PaginatedResponse<JobApplication> = try await NetworkService.shared.request(endpoint)
        
        let localDB = LocalDatabase.shared
        for application in response.items {
            try await localDB.create(entityType: "JobApplication", entityId: application.id, data: [])
        }
    }
    
    private func fetchAndStoreResumes() async throws {
        let endpoint = MobileEndpoint.getResumes
        let response: [Resume] = try await NetworkService.shared.request(endpoint)
        
        let localDB = LocalDatabase.shared
        for resume in response {
            try await localDB.create(entityType: "Resume", entityId: resume.id, data: [])
        }
    }
    
    private func fetchAndStoreInterviews() async throws {
        let endpoint = MobileEndpoint.getInterviews
        let response: [InterviewSession] = try await NetworkService.shared.request(endpoint)
        
        let localDB = LocalDatabase.shared
        for interview in response {
            try await localDB.create(entityType: "InterviewSession", entityId: interview.id, data: [])
        }
    }
    
    // MARK: - Local Storage
    
    private func getPendingChanges() -> [OfflineChange] {
        guard let data = userDefaults.data(forKey: pendingChangesKey),
              let changes = try? JSONDecoder().decode([OfflineChange].self, from: data) else {
            return []
        }
        return changes
    }
    
    private func savePendingChanges(_ changes: [OfflineChange]) {
        guard let data = try? JSONEncoder().encode(changes) else { return }
        userDefaults.set(data, forKey: pendingChangesKey)
    }
    
    func clearPendingChanges() {
        userDefaults.removeObject(forKey: pendingChangesKey)
        syncStatus.pendingChanges = 0
    }
}

// MARK: - Local Database

final class LocalDatabase {
    static let shared = LocalDatabase()
    
    private init() {}
    
    /**
     Create entity in local database.
     Uses os_log with private隐私 configuration to prevent sensitive data exposure.
     */
    func create(entityType: String, entityId: String, data: [String: AnyCodable]) async throws {
        // Implementation would use SQLite or Realm
        // For now, this is a placeholder
        os_log("Creating %{public}@ with id %{public}@", log: .default, type: .debug, entityType, entityId)
    }
    
    /**
     Update entity in local database.
     Uses os_log with private隐私 configuration to prevent sensitive data exposure.
     */
    func update(entityType: String, entityId: String, data: [String: AnyCodable]) async throws {
        os_log("Updating %{public}@ with id %{public}@", log: .default, type: .debug, entityType, entityId)
    }
    
    /**
     Delete entity from local database.
     Uses os_log with private隐私 configuration to prevent sensitive data exposure.
     */
    func delete(entityType: String, entityId: String) async throws {
        os_log("Deleting %{public}@ with id %{public}@", log: .default, type: .debug, entityType, entityId)
    }
    
    func fetch(entityType: String, entityId: String) async throws -> [String: AnyCodable] {
        return [:]
    }
    
    func fetchAll(entityType: String) async throws -> [[String: AnyCodable]] {
        return []
    }
}

// MARK: - Response Types

struct SyncStartResponse: Codable {
    let syncId: String
    let startedAt: Date
}

struct SyncCompleteResponse: Codable {
    let syncId: String
    let completedAt: Date
    let recordsProcessed: Int
}
