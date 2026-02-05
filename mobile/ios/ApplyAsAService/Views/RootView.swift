//
//  RootView.swift
//  ApplyAsAService
//
//  Main app root view with tab navigation
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var authManager: AuthManager
    @EnvironmentObject private var syncManager: SyncManager
    @State private var selectedTab = 0
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView(selectedTab: $selectedTab)
            } else {
                AuthenticationView()
            }
        }
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

// MARK: - Main Tab View

struct MainTabView: View {
    @Binding var selectedTab: Int
    @EnvironmentObject private var notificationManager: NotificationManager
    
    var body: some View {
        TabView(selection: $selectedTab) {
            JobSearchView()
                .tabItem {
                    Label("Search", systemImage: "magnifyingglass")
                }
                .tag(0)
            
            ApplicationsView()
                .tabItem {
                    Label("Applications", systemImage: "briefcase")
                }
                .tag(1)
                .badge(notificationManager.unreadCount > 0 ? notificationManager.unreadCount : 0)
            
            InterviewPrepView()
                .tabItem {
                    Label("Interview", systemImage: "chat.bubble.text")
                }
                .tag(2)
            
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
                .tag(3)
        }
        .tint(.blue)
    }
}

// MARK: - Content View Placeholder

struct ContentView: View {
    @State private var searchText = ""
    @State private var selectedJob: JobPosting?
    
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
                    SectionHeader(title: "Recommended Jobs")
                        .padding(.horizontal)
                    
                    // Job Cards
                    LazyVStack(spacing: 12) {
                        ForEach(0..<10) { index in
                            JobCardView(job: sampleJob)
                                .onTapGesture {
                                    selectedJob = sampleJob
                                }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Find Your Dream Job")
            .navigationBarTitleDisplayMode(.large)
            .sheet(item: $selectedJob) { job in
                JobDetailView(job: job)
            }
        }
    }
}

// MARK: - Sample Data

let sampleJob = JobPosting(
    id: "1",
    title: "Senior iOS Developer",
    company: Company(
        id: "1",
        name: "TechCorp Inc.",
        logoURL: nil,
        website: "https://techcorp.com",
        size: .large,
        industry: "Technology"
    ),
    location: Location(city: "San Francisco", state: "CA", country: "USA", zipCode: "94102", coordinates: nil),
    jobType: .fullTime,
    description: "We are looking for a Senior iOS Developer...",
    requirements: ["Swift", "SwiftUI", "iOS SDK"],
    salaryRange: SalaryRange(min: 150000, max: 200000, currency: "USD", period: .yearly),
    applicationDeadline: Date().addingTimeInterval(86400 * 7),
    postedAt: Date(),
    remoteType: .hybrid,
    skills: ["Swift", "SwiftUI", "Combine", "iOS"],
    benefits: ["Health Insurance", "401k", "Remote Work"],
    applicationCount: 45,
    isSaved: false
)

// MARK: - Preview

#Preview {
    RootView()
        .environmentObject(AuthManager.shared)
        .environmentObject(SyncManager.shared)
        .environmentObject(NotificationManager.shared)
}
