//
//  JobSearchViewModel.swift
//  ApplyAsAService
//
//  Job Search ViewModel using MVVM with Combine
//

import Foundation
import Combine
import SwiftUI

// MARK: - Job Search State

enum JobSearchState {
    case idle
    case loading
    case loaded
    case loadingMore
    case error(String)
    case empty
}

// MARK: - Job Search ViewModel

@MainActor
final class JobSearchViewModel: ObservableObject {
    // MARK: - Published Properties
    
    @Published var searchState: JobSearchState = .idle
    @Published var jobs: [JobPosting] = []
    @Published var savedJobs: [JobPosting] = []
    @Published var recommendedJobs: [JobPosting] = []
    @Published var searchQuery = ""
    @Published var selectedFilters: JobSearchCriteria = JobSearchCriteria(
        query: nil,
        location: nil,
        jobTypes: [],
        remoteTypes: [],
        salaryMin: nil,
        salaryMax: nil,
        experienceLevels: [],
        skills: [],
        industries: [],
        companySizes: [],
        postedWithin: nil,
        page: 1,
        limit: 20,
        sortBy: .relevance,
        sortOrder: .desc
    )
    @Published var showFilters = false
    @Published var errorMessage: String?
    @Published var hasMorePages = true
    
    // MARK: - Private Properties
    
    private var cancellables = Set<AnyCancellable>()
    private let networkService = NetworkService.shared
    private let syncManager = SyncManager.shared
    
    private var currentPage = 1
    private var isLoading = false
    
    // MARK: - Search Debounce
    
    private var searchDebouncer: AnyCancellable?
    
    init() {
        setupSearchDebounce()
    }
    
    private func setupSearchDebounce() {
        searchDebouncer = $searchQuery
            .debounce(for: .milliseconds(500), scheduler: DispatchQueue.main)
            .removeDuplicates()
            .sink { [weak self] query in
                Task {
                    await self?.performSearch(query: query)
                }
            }
    }
    
    // MARK: - Search
    
    func performSearch(query: String? = nil) async {
        guard !isLoading else { return }
        
        isLoading = true
        searchState = .loading
        currentPage = 1
        
        var criteria = selectedFilters
        criteria.query = query ?? searchQuery
        criteria.page = currentPage
        
        do {
            let endpoint = MobileEndpoint.searchJobs(criteria: criteria)
            let response: PaginatedResponse<JobPosting> = try await networkService.request(endpoint)
            
            jobs = response.items
            hasMorePages = response.hasNext
            searchState = jobs.isEmpty ? .empty : .loaded
        } catch {
            searchState = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func loadMoreJobs() async {
        guard !isLoading, hasMorePages, searchState == .loaded else { return }
        
        isLoading = true
        searchState = .loadingMore
        currentPage += 1
        
        var criteria = selectedFilters
        criteria.query = searchQuery
        criteria.page = currentPage
        
        do {
            let endpoint = MobileEndpoint.searchJobs(criteria: criteria)
            let response: PaginatedResponse<JobPosting> = try await networkService.request(endpoint)
            
            jobs.append(contentsOf: response.items)
            hasMorePages = response.hasNext
            searchState = .loaded
        } catch {
            searchState = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func refreshJobs() async {
        await performSearch()
    }
    
    // MARK: - Saved Jobs
    
    func loadSavedJobs() async {
        searchState = .loading
        
        do {
            let endpoint = MobileEndpoint.getSavedJobs
            let response: [JobPosting] = try await networkService.request(endpoint)
            
            savedJobs = response
            searchState = savedJobs.isEmpty ? .empty : .loaded
        } catch {
            searchState = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
    }
    
    func saveJob(_ job: JobPosting) async {
        do {
            let endpoint = MobileEndpoint.saveJob(id: job.id)
            _ = try await networkService.request(endpoint)
            
            await MainActor.run {
                if let index = jobs.firstIndex(where: { $0.id == job.id }) {
                    jobs[index].isSaved = true
                }
                if !savedJobs.contains(where: { $0.id == job.id }) {
                    savedJobs.append(jobs[index])
                }
            }
            
            // Queue for sync
            syncManager.queueUpdate(
                entityType: "JobPosting",
                entityId: job.id,
                data: ["isSaved": AnyCodable(true)]
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func unsaveJob(_ job: JobPosting) async {
        do {
            let endpoint = MobileEndpoint.unsaveJob(id: job.id)
            _ = try await networkService.request(endpoint)
            
            await MainActor.run {
                if let index = jobs.firstIndex(where: { $0.id == job.id }) {
                    jobs[index].isSaved = false
                }
                savedJobs.removeAll { $0.id == job.id }
            }
            
            // Queue for sync
            syncManager.queueUpdate(
                entityType: "JobPosting",
                entityId: job.id,
                data: ["isSaved": AnyCodable(false)]
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func toggleSaveJob(_ job: JobPosting) async {
        if job.isSaved {
            await unsaveJob(job)
        } else {
            await saveJob(job)
        }
    }
    
    // MARK: - Recommendations
    
    func loadRecommendedJobs() async {
        do {
            let endpoint = MobileEndpoint.getJobRecommendations
            let response: [JobPosting] = try await networkService.request(endpoint)
            
            await MainActor.run {
                recommendedJobs = response
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Filters
    
    func applyFilters(_ criteria: JobSearchCriteria) async {
        selectedFilters = criteria
        showFilters = false
        await performSearch()
    }
    
    func clearFilters() {
        selectedFilters = JobSearchCriteria(
            query: nil,
            location: nil,
            jobTypes: [],
            remoteTypes: [],
            salaryMin: nil,
            salaryMax: nil,
            experienceLevels: [],
            skills: [],
            industries: [],
            companySizes: [],
            postedWithin: nil,
            page: 1,
            limit: 20,
            sortBy: .relevance,
            sortOrder: .desc
        )
    }
    
    // MARK: - Offline Support
    
    func loadCachedJobs() {
        // Load jobs from local database
        // This would use the LocalDatabase service
    }
}
