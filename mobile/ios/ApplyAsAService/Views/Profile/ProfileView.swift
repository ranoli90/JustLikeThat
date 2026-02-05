//
//  ProfileView.swift
//  ApplyAsAService
//
//  User profile and settings
//

import SwiftUI

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @EnvironmentObject private var authManager: AuthManager
    @State private var showSettings = false
    @State private var showLogoutConfirmation = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Profile Header
                    ProfileHeaderView(
                        name: authManager.currentUser?.fullName ?? "Guest",
                        email: authManager.currentUser?.email ?? "",
                        avatarURL: authManager.currentUser?.avatarURL
                    )
                    
                    // Resume Section
                    ResumeSectionView()
                    
                    // Quick Stats
                    ProfileStatsView()
                    
                    // Settings
                    SettingsSectionView(showSettings: $showSettings)
                    
                    // Logout
                    LogoutButton(showConfirmation: $showLogoutConfirmation)
                }
                .padding()
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .alert("Log Out", isPresented: $showLogoutConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Log Out", role: .destructive) {
                    Task {
                        await authManager.logout()
                    }
                }
            } message: {
                Text("Are you sure you want to log out?")
            }
        }
    }
}

// MARK: - Profile Header View

struct ProfileHeaderView: View {
    let name: String
    let email: String
    let avatarURL: String?
    
    var body: some View {
        VStack(spacing: 16) {
            // Avatar
            if let url = avatarURL, let imageURL = URL(string: url) {
                AsyncImage(url: imageURL) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        placeholderAvatar
                    case .empty:
                        ProgressView()
                    @unknown default:
                        placeholderAvatar
                    }
                }
                .frame(width: 100, height: 100)
                .clipShape(Circle())
            } else {
                placeholderAvatar
            }
            
            VStack(spacing: 4) {
                Text(name)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(email)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            // Edit Profile Button
            Button(action: {}) {
                HStack {
                    Image(systemName: "pencil")
                    Text("Edit Profile")
                }
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(20)
            }
        }
    }
    
    private var placeholderAvatar: some View {
        Circle()
            .fill(Color.blue.opacity(0.2))
            .frame(width: 100, height: 100)
            .overlay {
                Text(String(name.prefix(2)).uppercased())
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundStyle(.blue)
            }
    }
}

// MARK: - Resume Section View

struct ResumeSectionView: View {
    @State private var showResumeManager = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Resumes")
                    .font(.headline)
                
                Spacer()
                
                Button(action: {
                    showResumeManager = true
                }) {
                    Text("Manage")
                        .font(.subheadline)
                }
            }
            
            VStack(spacing: 12) {
                ResumeCard(
                    title: "Resume 2024",
                    lastUpdated: Date().addingTimeInterval(-86400 * 3),
                    isDefault: true
                )
                
                ResumeCard(
                    title: "Resume - Tech",
                    lastUpdated: Date().addingTimeInterval(-86400 * 10),
                    isDefault: false
                )
                
                // Add Resume Button
                Button(action: {}) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                        Text("Add New Resume")
                    }
                    .font(.subheadline)
                    .foregroundStyle(.blue)
                }
            }
        }
        .sheet(isPresented: $showResumeManager) {
            ResumeManagerView()
        }
    }
}

struct ResumeCard: View {
    let title: String
    let lastUpdated: Date
    let isDefault: Bool
    
    var body: some View {
        HStack {
            Image(systemName: "doc.fill")
                .foregroundStyle(.blue)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    if isDefault {
                        Text("Default")
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.1))
                            .foregroundStyle(.blue)
                            .cornerRadius(4)
                    }
                }
                
                Text("Updated \(timeAgo(lastUpdated))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Menu {
                Button(action: {}) {
                    Label("Set as Default", systemImage: "checkmark")
                }
                Button(action: {}) {
                    Label("Download", systemImage: "arrow.down.circle")
                }
                Button(role: .destructive, action: {}) {
                    Label("Delete", systemImage: "trash")
                }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }
    
    private func timeAgo(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Profile Stats View

struct ProfileStatsView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Your Activity")
                .font(.headline)
            
            HStack(spacing: 12) {
                ProfileStatCard(
                    value: "24",
                    label: "Applications",
                    icon: "briefcase.fill",
                    color: .blue
                )
                
                ProfileStatCard(
                    value: "12",
                    label: "Interviews",
                    icon: "person.2.fill",
                    color: .green
                )
            }
            
            HStack(spacing: 12) {
                ProfileStatCard(
                    value: "8",
                    label: "Saved Jobs",
                    icon: "bookmark.fill",
                    color: .orange
                )
                
                ProfileStatCard(
                    value: "85%",
                    label: "Response Rate",
                    icon: "chart.line.uptrend.xyaxis",
                    color: .purple
                )
            }
        }
    }
}

struct ProfileStatCard: View {
    let value: String
    let label: String
    let icon: String
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
        .padding()
        .background(color.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Settings Section View

struct SettingsSectionView: View {
    @Binding var showSettings: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Settings")
                .font(.headline)
            
            VStack(spacing: 0) {
                SettingsRow(
                    icon: "bell.fill",
                    title: "Notifications",
                    subtitle: "Manage your notification preferences"
                ) {
                    showSettings = true
                }
                
                SettingsRow(
                    icon: "lock.fill",
                    title: "Privacy & Security",
                    subtitle: "Biometric login, password, etc."
                ) {
                    showSettings = true
                }
                
                SettingsRow(
                    icon: "globe",
                    title: "Language & Region",
                    subtitle: "English (US)"
                ) {
                    showSettings = true
                }
                
                SettingsRow(
                    icon: "questionmark.circle.fill",
                    title: "Help & Support",
                    subtitle: "FAQ, contact us"
                ) {
                    // Navigate to help
                }
                
                SettingsRow(
                    icon: "info.circle.fill",
                    title: "About",
                    subtitle: "Version 1.0.0"
                ) {
                    // Show about
                }
            }
            .background(Color.secondary.opacity(0.05))
            .cornerRadius(12)
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(.blue)
                    .frame(width: 24)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                    
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Logout Button

struct LogoutButton: View {
    @Binding var showConfirmation: Bool
    
    var body: some View {
        Button(action: {
            showConfirmation = true
        }) {
            HStack {
                Image(systemName: "rectangle.portrait.and.arrow.right")
                Text("Log Out")
            }
            .font(.subheadline)
            .foregroundStyle(.red)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red.opacity(0.05))
            .cornerRadius(12)
        }
    }
}

// MARK: - Settings View

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                Section("Notifications") {
                    Toggle("Push Notifications", isOn: .constant(true))
                    Toggle("Email Notifications", isOn: .constant(true))
                    Toggle("Interview Reminders", isOn: .constant(true))
                    Toggle("Job Match Alerts", isOn: .constant(true))
                }
                
                Section("Privacy") {
                    NavigationLink("Biometric Login") {
                        BiometricSettingsView()
                    }
                    NavigationLink("Data & Privacy") {
                        EmptyView()
                    }
                }
                
                Section("Account") {
                    NavigationLink("Subscription") {
                        EmptyView()
                    }
                    NavigationLink("Export Data") {
                        EmptyView()
                    }
                    Button("Delete Account", role: .destructive) {}
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Biometric Settings View

struct BiometricSettingsView: View {
    @State private var biometricEnabled = false
    @StateObject private var biometricManager = BiometricAuthManager.shared
    
    var body: some View {
        List {
            Section {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Enable Biometric Login")
                            .font(.body)
                        
                        Text("Use \(biometricManager.biometricType.displayName) to log in quickly")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    Toggle("", isOn: $biometricEnabled)
                        .labelsHidden()
                }
            }
        }
        .onAppear {
            biometricEnabled = biometricManager.isBiometricEnabled
        }
        .onChange(of: biometricEnabled) { _, newValue in
            if newValue {
                Task {
                    try? await biometricManager.enrollBiometric()
                }
            } else {
                biometricManager.disableBiometric()
            }
        }
    }
}

// MARK: - Resume Manager View

struct ResumeManagerView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var showUploadSheet = false
    
    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button(action: {
                        showUploadSheet = true
                    }) {
                        Label("Upload New Resume", systemImage: "plus")
                    }
                }
                
                Section("Your Resumes") {
                    ForEach(0..<3) { index in
                        ResumeRow(index: index)
                    }
                }
            }
            .navigationTitle("Resumes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showUploadSheet) {
                UploadResumeView()
            }
        }
    }
}

struct ResumeRow: View {
    let index: Int
    
    var body: some View {
        HStack {
            Image(systemName: "doc.fill")
                .foregroundStyle(.blue)
            
            VStack(alignment: .leading) {
                Text("Resume \(index + 1)")
                    .font(.body)
                
                Text("Updated 3 days ago")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            if index == 0 {
                Text("Default")
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.1))
                    .foregroundStyle(.blue)
                    .cornerRadius(4)
            }
        }
    }
}

struct UploadResumeView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var resumeTitle = ""
    @State private var selectedFile: URL?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Upload Area
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.secondary.opacity(0.05))
                    .frame(height: 150)
                    .overlay {
                        VStack(spacing: 12) {
                            Image(systemName: "doc.badge.plus")
                                .font(.largeTitle)
                                .foregroundStyle(.blue)
                            
                            Text("Upload Resume")
                                .font(.headline)
                            
                            Text("PDF, DOC, or DOCX up to 10MB")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .onTapGesture {
                        // Show file picker
                    }
                
                // Title Input
                VStack(alignment: .leading, spacing: 8) {
                    Text("Resume Title")
                        .font(.subheadline)
                    
                    TextField("e.g., Resume 2024", text: $resumeTitle)
                        .textFieldStyle(.roundedBorder)
                }
                
                Spacer()
                
                Button(action: {
                    dismiss()
                }) {
                    Text("Upload")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundStyle(.white)
                        .cornerRadius(12)
                }
                .disabled(resumeTitle.isEmpty)
            }
            .padding()
            .navigationTitle("Upload Resume")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Profile ViewModel

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var resumes: [Resume] = []
    @Published var isLoading = false
    
    // Implementation would load profile data
}

// MARK: - Preview

#Preview {
    ProfileView()
        .environmentObject(AuthManager.shared)
}
