//
//  ApplicationsViewModel.swift
//  ApplyAsAService
//
//  Applications Tracking ViewModel using MVVM with Combine
//

import Foundation
import Combine
import SwiftUI

// MARK: - Applications State

enum ApplicationsState {
    case idle
    case loading
    case loaded
    case error(String)
    case empty
}

// MARK: - Applications ViewModel

@MainActor
final class ApplicationsViewModel: ObservableObject {
    // MARK: - Published Properties
    
    @Published var applicationsState: ApplicationsState = .idle
    @Published var applications: [JobApplication] = []
    @Published var selectedApplication: JobApplication?
    @Published var filterStatus: ApplicationStatus?
    @Published var sortOrder: SortOrder = .desc
    @Published var errorMessage: String?
    @Published var isRefreshing = false
    
    // MARK: - Statistics
    
    @Published var applicationStats: ApplicationStats = ApplicationStats(
        total: 0,
        inProgress: 0,
        interviews: 0,
        offers: 0,
        rejected: 0,
        withdrawn: 0
    )
    
    // MARK: - Private Properties
    
    private var cancellables = Set<AnyCancellable>()
    private let networkService = NetworkService.shared
    private let syncManager = SyncManager.shared
    
    private var currentPage = 1
    private var isLoading = false
    private var hasMorePages = true
    
    // MARK: - Initialization
    
    init() {
        setupFiltering()
    }
    
    private func setupFiltering() {
        $filterStatus
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { [weak self] _ in
                Task {
                    await self?.loadApplications()
                }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Load Applications
    
    func loadApplications(page: Int = 1) async {
        guard !isLoading else { return }
        
        isLoading = true
        applicationsState = .loading
        currentPage = page
        
        do {
            let endpoint = MobileEndpoint.getApplications(page: currentPage, limit: 20)
            let response: PaginatedResponse<JobApplication> = try await networkService.request(endpoint)
            
            if page == 1 {
                applications = filterApplications(response.items)
            } else {
                applications.append(contentsOf: filterApplications(response.items))
            }
            
            hasMorePages = response.hasNext
            applicationsState = applications.isEmpty ? .empty : .loaded
            
            // Calculate statistics
            calculateStats()
            
        } catch {
            applicationsState = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func loadMoreApplications() async {
        guard !isLoading, hasMorePages, applicationsState == .loaded else { return }
        
        await loadApplications(page: currentPage + 1)
    }
    
    func refreshApplications() async {
        isRefreshing = true
        await loadApplications()
        isRefreshing = false
    }
    
    // MARK: - Filtering
    
    private func filterApplications(_ apps: [JobApplication]) -> [JobApplication] {
        if let status = filterStatus {
            return apps.filter { $0.status == status }
        }
        return apps
    }
    
    func setFilter(_ status: ApplicationStatus?) {
        filterStatus = status
    }
    
    // MARK: - Sorting
    
    func sortApplications() {
        applications.sort { app1, app2 in
            switch sortOrder {
            case .desc:
                return app1.appliedAt > app2.appliedAt
            case .asc:
                return app1.appliedAt < app2.appliedAt
            }
        }
    }
    
    func toggleSortOrder() {
        sortOrder = sortOrder == .desc ? .asc : .desc
        sortApplications()
    }
    
    // MARK: - Application Details
    
    func loadApplicationDetails(id: String) async {
        do {
            let endpoint = MobileEndpoint.getApplication(id: id)
            let application: JobApplication = try await networkService.request(endpoint)
            
            await MainActor.run {
                selectedApplication = application
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Create Application
    
    func createApplication(
        jobId: String,
        resumeId: String?,
        coverLetter: String?,
        notes: String?
    ) async -> Result<JobApplication, Error> {
        let request = CreateApplicationRequest(
            jobId: jobId,
            resumeId: resumeId,
            coverLetter: coverLetter,
            notes: notes
        )
        
        do {
            let endpoint = MobileEndpoint.createApplication(request: request)
            let application: JobApplication = try await networkService.request(endpoint)
            
            await MainActor.run {
                applications.insert(application, at: 0)
                calculateStats()
            }
            
            // Queue for sync
            syncManager.queueCreate(
                entityType: "JobApplication",
                entityId: application.id,
                data: [:]
            )
            
            return .success(application)
        } catch {
            return .failure(error)
        }
    }
    
    // MARK: - Update Application
    
    func updateApplication(
        id: String,
        resumeId: String?,
        coverLetter: String?,
        notes: String?
    ) async -> Result<JobApplication, Error> {
        let request = UpdateApplicationRequest(
            resumeId: resumeId,
            coverLetter: coverLetter,
            notes: notes
        )
        
        do {
            let endpoint = MobileEndpoint.updateApplication(id: id, request: request)
            let application: JobApplication = try await networkService.request(endpoint)
            
            await MainActor.run {
                if let index = applications.firstIndex(where: { $0.id == id }) {
                    applications[index] = application
                }
                if selectedApplication?.id == id {
                    selectedApplication = application
                }
            }
            
            // Queue for sync
            syncManager.queueUpdate(
                entityType: "JobApplication",
                entityId: id,
                data: [:]
            )
            
            return .success(application)
        } catch {
            return .failure(error)
        }
    }
    
    // MARK: - Withdraw Application
    
    func withdrawApplication(id: String) async -> Result<Void, Error> {
        do {
            let endpoint = MobileEndpoint.withdrawApplication(id: id)
            try await networkService.requestVoid(endpoint)
            
            await MainActor.run {
                if let index = applications.firstIndex(where: { $0.id == id }) {
                    applications[index].status = .withdrawn
                }
                calculateStats()
            }
            
            // Queue for sync
            syncManager.queueUpdate(
                entityType: "JobApplication",
                entityId: id,
                data: ["status": AnyCodable("withdrawn")]
            )
            
            return .success(())
        } catch {
            return .failure(error)
        }
    }
    
    // MARK: - Statistics
    
    private func calculateStats() {
        let total = applications.count
        let inProgress = applications.filter {
            [.draft, .submitted, .screening, .interview, .assessment].contains($0.status)
        }.count
        let interviews = applications.filter { $0.status == .interview }.count
        let offers = applications.filter { $0.status == .offer }.count
        let rejected = applications.filter { $0.status == .rejected }.count
        let withdrawn = applications.filter { $0.status == .withdrawn }.count
        
        applicationStats = ApplicationStats(
            total: total,
            inProgress: inProgress,
            interviews: interviews,
            offers: offers,
            rejected: rejected,
            withdrawn: withdrawn
        )
    }
    
    // MARK: - Grouped Applications
    
    var groupedApplications: [(key: String, applications: [JobApplication])] {
        let grouped = Dictionary(grouping: applications) { application -> String in
            let formatter = DateFormatter()
            formatter.dateFormat = "MMMM yyyy"
            return formatter.string(from: application.appliedAt)
        }
        
        return grouped.sorted { $0.key > $1.key }
    }
}

// MARK: - Application Stats

struct ApplicationStats {
    let total: Int
    let inProgress: Int
    let interviews: Int
    let offers: Int
    let rejected: Int
    let withdrawn: Int
}
