//
//  ApplicationsView.swift
//  ApplyAsAService
//
//  Job Applications tracking UI
//

import SwiftUI

struct ApplicationsView: View {
    @StateObject private var viewModel = ApplicationsViewModel()
    @State private var selectedApplication: JobApplication?
    @State private var showFilterSheet = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Stats Cards
                    ApplicationStatsView(stats: viewModel.applicationStats)
                        .padding(.horizontal)
                    
                    // Filter Pills
                    FilterPillsView(
                        selectedFilter: viewModel.filterStatus,
                        onSelect: { status in
                            viewModel.setFilter(status)
                        }
                    )
                    .padding(.horizontal)
                    
                    // Applications List
                    switch viewModel.applicationsState {
                    case .loading:
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding()
                        
                    case .empty:
                        EmptyStateView(
                            icon: "briefcase",
                            title: "No Applications",
                            message: "Start applying to jobs to track your progress"
                        )
                        .padding()
                        
                    case .error(let message):
                        ErrorStateView(message: message) {
                            Task {
                                await viewModel.refreshApplications()
                            }
                        }
                        .padding()
                        
                    default:
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.applications) { application in
                                ApplicationCard(application: application)
                                    .onTapGesture {
                                        selectedApplication = application
                                    }
                                    .onAppear {
                                        if application.id == viewModel.applications.last?.id {
                                            Task {
                                                await viewModel.loadMoreApplications()
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
            .navigationTitle("Applications")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: {
                        viewModel.toggleSortOrder()
                    }) {
                        Image(systemName: viewModel.sortOrder == .desc ? "arrow.down" : "arrow.up")
                    }
                }
            }
            .refreshable {
                await viewModel.refreshApplications()
            }
            .sheet(item: $selectedApplication) { application in
                ApplicationDetailView(application: application)
            }
            .task {
                await viewModel.loadApplications()
            }
        }
    }
}

// MARK: - Application Stats View

struct ApplicationStatsView: View {
    let stats: ApplicationStats
    
    var body: some View {
        HStack(spacing: 12) {
            StatCard(
                value: "\(stats.total)",
                label: "Total",
                icon: "briefcase.fill",
                color: .blue
            )
            
            StatCard(
                value: "\(stats.inProgress)",
                label: "In Progress",
                icon: "clock.fill",
                color: .orange
            )
            
            StatCard(
                value: "\(stats.interviews)",
                label: "Interviews",
                icon: "person.2.fill",
                color: .purple
            )
            
            StatCard(
                value: "\(stats.offers)",
                label: "Offers",
                icon: "checkmark.seal.fill",
                color: .green
            )
        }
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(color)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Filter Pills View

struct FilterPillsView: View {
    let selectedFilter: ApplicationStatus?
    let onSelect: (ApplicationStatus?) -> Void
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterPill(
                    title: "All",
                    isSelected: selectedFilter == nil
                ) {
                    onSelect(nil)
                }
                
                ForEach([ApplicationStatus.submitted, .interview, .offer], id: \.self) { status in
                    FilterPill(
                        title: status.displayName,
                        isSelected: selectedFilter == status
                    ) {
                        onSelect(status)
                    }
                }
            }
        }
    }
}

struct FilterPill: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color.secondary.opacity(0.1))
                .foregroundStyle(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

// MARK: - Application Card

struct ApplicationCard: View {
    let application: JobApplication
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(application.job.title)
                        .font(.headline)
                    
                    Text(application.job.company.name)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                StatusBadge(status: application.status)
            }
            
            // Progress Bar
            ApplicationProgressBar(progress: application.statusProgress)
                .frame(height: 4)
            
            // Footer
            HStack {
                Text("Applied \(timeAgo(application.appliedAt))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                if application.interviewCount > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "video.fill")
                            .font(.caption2)
                        Text("\(application.interviewCount)")
                            .font(.caption)
                    }
                    .foregroundStyle(.purple)
                }
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(16)
    }
    
    private func timeAgo(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Status Badge

struct StatusBadge: View {
    let status: ApplicationStatus
    
    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(statusColor.opacity(0.1))
            .foregroundStyle(statusColor)
            .cornerRadius(8)
    }
    
    private var statusColor: Color {
        switch status {
        case .draft: return .gray
        case .submitted: return .blue
        case .screening: return .indigo
        case .interview: return .purple
        case .assessment: return .orange
        case .offer: return .green
        case .hired: return .green
        case .rejected: return .red
        case .withdrawn: return .gray
        }
    }
}

// MARK: - Progress Bar

struct ApplicationProgressBar: View {
    let progress: Double
    
    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.secondary.opacity(0.1))
                    .frame(height: 4)
                    .cornerRadius(2)
                
                Rectangle()
                    .fill(progressColor)
                    .frame(width: geometry.size.width * progress, height: 4)
                    .cornerRadius(2)
            }
        }
    }
    
    private var progressColor: Color {
        if progress >= 1.0 {
            return .green
        } else if progress >= 0.5 {
            return .blue
        } else {
            return .orange
        }
    }
}

// MARK: - Application Detail View

struct ApplicationDetailView: View {
    let application: JobApplication
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 16) {
                        Text(application.job.title)
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(application.job.company.name)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        
                        StatusBadge(status: application.status)
                    }
                    
                    Divider()
                    
                    // Timeline
                    ApplicationTimelineView(application: application)
                    
                    // Documents
                    if let resume = application.resume {
                        DocumentsSection(resume: resume, documents: application.documents)
                    }
                    
                    // Cover Letter
                    if let coverLetter = application.coverLetter {
                        CoverLetterSection(coverLetter: coverLetter)
                    }
                    
                    // Notes
                    if let notes = application.notes {
                        NotesSection(notes: notes)
                    }
                    
                    // Actions
                    ActionsSection(application: application)
                    
                    Spacer(minLength: 100)
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Timeline View

struct ApplicationTimelineView: View {
    let application: JobApplication
    
    private let stages: [(ApplicationStatus, String)] = [
        (.submitted, "Applied"),
        (.screening, "Screening"),
        (.interview, "Interview"),
        (.assessment, "Assessment"),
        (.offer, "Offer")
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Application Progress")
                .font(.headline)
            
            ForEach(Array(stages.enumerated()), id: \.offset) { index, stage in
                HStack(spacing: 12) {
                    // Line
                    if index < stages.count - 1 {
                        Rectangle()
                            .fill(isCompleted(stage.0) ? Color.blue : Color.secondary.opacity(0.2))
                            .frame(width: 2, height: 20)
                            .frame(maxHeight: .infinity)
                            .position(x: 10, y: 30)
                    }
                    
                    // Circle
                    Circle()
                        .fill(circleColor(for: stage.0))
                        .frame(width: 20, height: 20)
                        .overlay {
                            if isCompleted(stage.0) || isCurrent(stage.0) {
                                Image(systemName: isCompleted(stage.0) ? "checkmark" : "clock")
                                    .font(.caption2)
                                    .foregroundStyle(.white)
                            }
                        }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(stage.1)
                            .font(.subheadline)
                            .fontWeight(isCurrent(stage.0) ? .semibold : .regular)
                        
                        if isCompleted(stage.0) {
                            Text(formattedDate(application.appliedAt))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    
                    Spacer()
                }
            }
        }
    }
    
    private func isCompleted(_ status: ApplicationStatus) -> Bool {
        let order: [ApplicationStatus] = [.submitted, .screening, .interview, .assessment, .offer]
        guard let currentIndex = order.firstIndex(of: application.status),
              let stageIndex = order.firstIndex(of: status) else {
            return false
        }
        return stageIndex < currentIndex
    }
    
    private func isCurrent(_ status: ApplicationStatus) -> Bool {
        return application.status == status
    }
    
    private func circleColor(for status: ApplicationStatus) -> Color {
        if isCompleted(status) {
            return .blue
        } else if isCurrent(status) {
            return .orange
        } else {
            return .secondary.opacity(0.3)
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Documents Section

struct DocumentsSection: View {
    let resume: Resume
    let documents: [Document]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Documents")
                .font(.headline)
            
            DocumentRow(
                icon: "doc.fill",
                name: resume.title,
                size: formatFileSize(resume.fileSize)
            )
            
            ForEach(documents) { document in
                DocumentRow(
                    icon: "doc.fill",
                    name: document.name,
                    size: formatFileSize(document.fileSize)
                )
            }
        }
    }
    
    private func formatFileSize(_ bytes: Int) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: Int64(bytes))
    }
}

struct DocumentRow: View {
    let icon: String
    let name: String
    let size: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(.blue)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.subheadline)
                Text(size)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "arrow.down.circle")
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(8)
    }
}

// MARK: - Cover Letter Section

struct CoverLetterSection: View {
    let coverLetter: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Cover Letter")
                .font(.headline)
            
            Text(coverLetter)
                .font(.body)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Notes Section

struct NotesSection: View {
    let notes: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Notes")
                .font(.headline)
            
            Text(notes)
                .font(.body)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Actions Section

struct ActionsSection: View {
    let application: JobApplication
    
    var body: some View {
        VStack(spacing: 12) {
            Button(action: {}) {
                HStack {
                    Image(systemName: "envelope.fill")
                    Text("Message Recruiter")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundStyle(.white)
                .cornerRadius(12)
            }
            
            if application.status != .withdrawn {
                Button(action: {}) {
                    HStack {
                        Image(systemName: "xmark.circle.fill")
                        Text("Withdraw Application")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .foregroundStyle(.red)
                    .cornerRadius(12)
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    ApplicationsView()
}
