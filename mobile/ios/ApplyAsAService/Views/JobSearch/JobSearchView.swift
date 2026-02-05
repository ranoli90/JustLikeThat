//
//  JobSearchView.swift
//  ApplyAsAService
//
//  Job Search UI with search functionality
//

import SwiftUI

struct JobSearchView: View {
    @StateObject private var viewModel = JobSearchViewModel()
    @State private var searchText = ""
    @State private var selectedJob: JobPosting?
    @State private var showFilters = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Search Bar
                    SearchBar(text: $searchText)
                        .padding(.horizontal)
                    
                    // Quick Stats
                    QuickStatsView()
                        .padding(.horizontal)
                    
                    // Recommended Jobs
                    if !viewModel.recommendedJobs.isEmpty {
                        SectionHeader(title: "Recommended for You")
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(viewModel.recommendedJobs) { job in
                                    RecommendedJobCard(job: job)
                                        .onTapGesture {
                                            selectedJob = job
                                        }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    // Saved Jobs
                    if !viewModel.savedJobs.isEmpty {
                        SectionHeader(title: "Saved Jobs")
                            .padding(.horizontal)
                        
                        ForEach(viewModel.savedJobs.prefix(3)) { job in
                            JobCardView(job: job)
                                .onTapGesture {
                                    selectedJob = job
                                }
                                .padding(.horizontal)
                        }
                    }
                    
                    // All Jobs
                    SectionHeader(
                        title: "All Jobs",
                        action: "Filter",
                        showAction: true
                    ) {
                        showFilters = true
                    }
                    .padding(.horizontal)
                    
                    // Job List
                    switch viewModel.searchState {
                    case .loading:
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding()
                        
                    case .empty:
                        EmptyStateView(
                            icon: "magnifyingglass",
                            title: "No Jobs Found",
                            message: "Try adjusting your search criteria"
                        )
                        .padding()
                        
                    case .error(let message):
                        ErrorStateView(message: message) {
                            Task {
                                await viewModel.refreshJobs()
                            }
                        }
                        .padding()
                        
                    default:
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.jobs) { job in
                                JobCardView(job: job)
                                    .onTapGesture {
                                        selectedJob = job
                                    }
                                    .onAppear {
                                        if job.id == viewModel.jobs.last?.id {
                                            Task {
                                                await viewModel.loadMoreJobs()
                                            }
                                        }
                                    }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Search")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {
                        showFilters = true
                    }) {
                        Image(systemName: "slider.horizontal.3")
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                JobFiltersView(criteria: $viewModel.selectedFilters) { criteria in
                    Task {
                        await viewModel.applyFilters(criteria)
                    }
                }
            }
            .sheet(item: $selectedJob) { job in
                JobDetailView(job: job)
            }
            .refreshable {
                await viewModel.refreshJobs()
            }
            .task {
                await viewModel.performSearch()
                await viewModel.loadRecommendedJobs()
                await viewModel.loadSavedJobs()
            }
        }
    }
}

// MARK: - Search Bar

struct SearchBar: View {
    @Binding var text: String
    @FocusState private var isFocused: Bool
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
            
            TextField("Search jobs, companies...", text: $text)
                .focused($isFocused)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
            
            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(12)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Quick Stats View

struct QuickStatsView: View {
    var body: some View {
        HStack(spacing: 16) {
            QuickStatCard(
                icon: "briefcase.fill",
                value: "12",
                label: "Applied",
                color: .blue
            )
            
            QuickStatCard(
                icon: "clock.fill",
                value: "3",
                label: "In Progress",
                color: .orange
            )
            
            QuickStatCard(
                icon: "checkmark.circle.fill",
                value: "1",
                label: "Interviews",
                color: .green
            )
            
            QuickStatCard(
                icon: "bookmark.fill",
                value: "8",
                label: "Saved",
                color: .purple
            )
        }
    }
}

struct QuickStatCard: View {
    let icon: String
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Section Header

struct SectionHeader: View {
    let title: String
    var action: String?
    var showAction = false
    var actionHandler: (() -> Void)?
    
    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
            
            Spacer()
            
            if showAction, let action = action {
                Button(action: action) {
                    Text(action)
                        .font(.subheadline)
                        .foregroundStyle(.blue)
                }
            }
        }
    }
}

// MARK: - Job Card View

struct JobCardView: View {
    let job: JobPosting
    @StateObject private var viewModel = JobSearchViewModel()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Company Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(job.title)
                        .font(.headline)
                        .lineLimit(2)
                    
                    Text(job.company.name)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Save Button
                Button(action: {
                    Task {
                        await viewModel.toggleSaveJob(job)
                    }
                }) {
                    Image(systemName: job.isSaved ? "bookmark.fill" : "bookmark")
                        .font(.title3)
                        .foregroundStyle(job.isSaved ? .blue : .secondary)
                }
            }
            
            // Job Details
            HStack(spacing: 16) {
                Label(job.location.city, systemImage: "mappin.circle.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Label(job.jobType.displayName, systemImage: "clock.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                if let salary = job.salaryRange {
                    Label(salaryRangeString(salary), systemImage: "dollarsign.circle.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            // Skills
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(job.skills.prefix(5), id: \.self) { skill in
                        Text(skill)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.1))
                            .foregroundStyle(.blue)
                            .cornerRadius(4)
                    }
                }
            }
            
            // Posted Time & Applications
            HStack {
                Text("Posted \(timeAgo(job.postedAt))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                Text("\(job.applicationCount) applicants")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(16)
    }
    
    private func salaryRangeString(_ salary: SalaryRange) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.maximumFractionDigits = 0
        
        let min = formatter.string(from: NSNumber(value: salary.min)) ?? ""
        let max = formatter.string(from: NSNumber(value: salary.max)) ?? ""
        
        return "\(min) - \(max)"
    }
    
    private func timeAgo(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Recommended Job Card

struct RecommendedJobCard: View {
    let job: JobPosting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Badge
            Text("Recommended")
                .font(.caption2)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.green.opacity(0.1))
                .foregroundStyle(.green)
                .cornerRadius(4)
            
            Text(job.title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .lineLimit(2)
            
            Text(job.company.name)
                .font(.caption)
                .foregroundStyle(.secondary)
            
            // Match Score
            HStack {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(.blue)
                Text("98% match")
                    .font(.caption)
                    .foregroundStyle(.blue)
            }
        }
        .frame(width: 160)
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Empty State View

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            
            Text(title)
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
    }
}

// MARK: - Error State View

struct ErrorStateView: View {
    let message: String
    let retryAction: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundStyle(.orange)
            
            Text("Something went wrong")
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            Button("Try Again", action: retryAction)
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
        .padding()
    }
}

// MARK: - Preview

#Preview {
    JobSearchView()
}
