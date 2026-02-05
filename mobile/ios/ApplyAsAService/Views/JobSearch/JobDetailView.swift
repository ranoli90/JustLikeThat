//
//  JobDetailView.swift
//  ApplyAsAService
//
//  Detailed job view with application functionality
//

import SwiftUI

struct JobDetailView: View {
    let job: JobPosting
    @Environment(\.dismiss) private var dismiss
    @State private var showApplySheet = false
    @State private var showShareSheet = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    JobHeaderView(job: job)
                    
                    Divider()
                    
                    // Job Description
                    DescriptionSection(title: "Description", content: job.description)
                    
                    // Requirements
                    if !job.requirements.isEmpty {
                        RequirementsSection(requirements: job.requirements)
                    }
                    
                    // Salary & Benefits
                    if let salary = job.salaryRange {
                        SalarySection(salary: salary)
                    }
                    
                    if !job.benefits.isEmpty {
                        BenefitsSection(benefits: job.benefits)
                    }
                    
                    // Company Info
                    CompanySection(company: job.company)
                    
                    // Location
                    LocationSection(location: job.location, remoteType: job.remoteType)
                    
                    // Skills
                    SkillsSection(skills: job.skills)
                    
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
                
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 16) {
                        Button(action: {
                            showShareSheet = true
                        }) {
                            Image(systemName: "square.and.arrow.up")
                        }
                        
                        Button(action: {
                            // Toggle save
                        }) {
                            Image(systemName: job.isSaved ? "bookmark.fill" : "bookmark")
                        }
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                ApplyButton(showApplySheet: $showApplySheet)
            }
            .sheet(isPresented: $showApplySheet) {
                ApplyToJobView(job: job)
            }
            .sheet(isPresented: $showShareSheet) {
                ShareSheet(items: [job.title, job.company.name, "Apply at: \(job.company.website ?? "")"])
            }
        }
    }
}

// MARK: - Job Header View

struct JobHeaderView: View {
    let job: JobPosting
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Company Logo Placeholder
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.secondary.opacity(0.1))
                .frame(width: 60, height: 60)
                .overlay {
                    Text(String(job.company.name.prefix(2)).uppercased())
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundStyle(.blue)
                }
            
            Text(job.title)
                .font(.title2)
                .fontWeight(.bold)
            
            HStack {
                Text(job.company.name)
                    .font(.subheadline)
                    .foregroundStyle(.blue)
                
                Text("•")
                    .foregroundStyle(.secondary)
                
                Text(job.company.size.rawValue.capitalized)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            // Tags
            HStack(spacing: 8) {
                JobTag(text: job.jobType.displayName, color: .blue)
                JobTag(text: job.remoteType.displayName, color: .green)
                
                if let deadline = job.applicationDeadline {
                    JobTag(
                        text: "Deadline: \(formattedDate(deadline))",
                        color: .red
                    )
                }
            }
            
            // Quick Info
            HStack(spacing: 24) {
                InfoItem(icon: "mappin.circle.fill", label: job.location.city)
                InfoItem(icon: "clock.fill", label: job.jobType.displayName)
                InfoItem(icon: "users.fill", label: "\(job.applicationCount) applied")
            }
        }
    }
    
    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

struct JobTag: View {
    let text: String
    let color: Color
    
    var body: some View {
        Text(text)
            .font(.caption)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(color.opacity(0.1))
            .foregroundStyle(color)
            .cornerRadius(8)
    }
}

struct InfoItem: View {
    let icon: String
    let label: String
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Description Section

struct DescriptionSection: View {
    let title: String
    let content: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
            
            Text(content)
                .font(.body)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - Requirements Section

struct RequirementsSection: View {
    let requirements: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Requirements")
                .font(.headline)
            
            VStack(alignment: .leading, spacing: 8) {
                ForEach(requirements, id: \.self) { requirement in
                    HStack(alignment: .top, spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                            .font(.caption)
                        
                        Text(requirement)
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

// MARK: - Salary Section

struct SalarySection: View {
    let salary: SalaryRange
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Salary")
                .font(.headline)
            
            HStack(spacing: 8) {
                Image(systemName: "dollarsign.circle.fill")
                    .foregroundStyle(.green)
                
                let formatter = NumberFormatter()
                formatter.numberStyle = .currency
                formatter.maximumFractionDigits = 0
                
                let min = formatter.string(from: NSNumber(value: salary.min)) ?? ""
                let max = formatter.string(from: NSNumber(value: salary.max)) ?? ""
                
                Text("\(min) - \(max) per \(salary.period.rawValue)")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - Benefits Section

struct BenefitsSection: View {
    let benefits: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Benefits")
                .font(.headline)
            
            FlowLayout(spacing: 8) {
                ForEach(benefits, id: \.self) { benefit in
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundStyle(.green)
                        Text(benefit)
                            .font(.caption)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.secondary.opacity(0.05))
                    .cornerRadius(8)
                }
            }
        }
    }
}

// MARK: - Company Section

struct CompanySection: View {
    let company: Company
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("About the Company")
                .font(.headline)
            
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.secondary.opacity(0.1))
                    .frame(width: 50, height: 50)
                    .overlay {
                        Text(String(company.name.prefix(2)).uppercased())
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundStyle(.blue)
                    }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(company.name)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                    
                    Text(company.industry)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            if let website = company.website {
                Link(destination: URL(string: website) ?? URL(string: "https://example.com")!) {
                    HStack {
                        Image(systemName: "globe")
                        Text("Visit Website")
                    }
                    .font(.subheadline)
                }
            }
        }
    }
}

// MARK: - Location Section

struct LocationSection: View {
    let location: Location
    let remoteType: RemoteType
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Location")
                .font(.headline)
            
            HStack {
                Image(systemName: "mappin.circle.fill")
                    .foregroundStyle(.red)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(location.city)
                        .font(.subheadline)
                    
                    let state = location.state ?? ""
                    Text(state.isEmpty ? location.country : "\(location.city), \(state)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            if remoteType != .onSite {
                HStack {
                    Image(systemName: remoteType == .remote ? "house.fill" : "arrow.left.arrow.right")
                        .foregroundStyle(.blue)
                    
                    Text(remoteType.displayName)
                        .font(.subheadline)
                }
            }
        }
    }
}

// MARK: - Skills Section

struct SkillsSection: View {
    let skills: [String]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Required Skills")
                .font(.headline)
            
            FlowLayout(spacing: 8) {
                ForEach(skills, id: \.self) { skill in
                    Text(skill)
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.1))
                        .foregroundStyle(.blue)
                        .cornerRadius(8)
                }
            }
        }
    }
}

// MARK: - Apply Button

struct ApplyButton: View {
    @Binding var showApplySheet: Bool
    
    var body: some View {
        VStack {
            Divider()
            
            Button(action: {
                showApplySheet = true
            }) {
                HStack {
                    Image(systemName: "paperplane.fill")
                    Text("Apply Now")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundStyle(.white)
                .cornerRadius(12)
            }
            .padding()
        }
        .background(.ultraThinMaterial)
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x,
                                       y: bounds.minY + result.positions[index].y),
                          proposal: ProposedViewSize(result.sizes[index]))
        }
    }
    
    struct FlowResult {
        var sizes: [CGSize] = []
        var positions: [CGPoint] = []
        var size: CGSize = .zero
        
        init(in maxWidth: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                sizes.append(size)
                
                if currentX + size.width > maxWidth && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }
                
                positions.append(CGPoint(x: currentX, y: currentY))
                lineHeight = max(lineHeight, size.height)
                currentX += size.width + spacing
            }
            
            size = CGSize(width: maxWidth, height: currentY + lineHeight)
        }
    }
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let items: [String]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Preview

#Preview {
    JobDetailView(job: sampleJob)
}
