//
//  InterviewPrepView.swift
//  ApplyAsAService
//
//  Interview preparation modules
//

import SwiftUI

struct InterviewPrepView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Upcoming Interviews
                    UpcomingInterviewsSection()
                    
                    // Practice Categories
                    PracticeCategoriesSection()
                    
                    // Interview Tips
                    InterviewTipsSection()
                    
                    // Mock Interview
                    MockInterviewSection()
                }
                .padding()
            }
            .navigationTitle("Interview Prep")
        }
    }
}

// MARK: - Upcoming Interviews Section

struct UpcomingInterviewsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Upcoming Interviews")
                    .font(.headline)
                
                Spacer()
                
                Text("3 this week")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            // Interview Cards
            VStack(spacing: 12) {
                UpcomingInterviewCard(
                    company: "TechCorp Inc.",
                    role: "Senior iOS Developer",
                    type: .video,
                    date: Date().addingTimeInterval(86400 * 2),
                    duration: 45
                )
                
                UpcomingInterviewCard(
                    company: "StartupXYZ",
                    role: "Mobile Developer",
                    type: .phone,
                    date: Date().addingTimeInterval(86400 * 5),
                    duration: 30
                )
            }
        }
    }
}

struct UpcomingInterviewCard: View {
    let company: String
    let role: String
    let type: InterviewType
    let date: Date
    let duration: Int
    
    var body: some View {
        HStack(spacing: 16) {
            // Date Box
            VStack(spacing: 4) {
                Text(dayString(date))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                Text(dayNumberString(date))
                    .font(.title)
                    .fontWeight(.bold)
                
                Text(monthString(date))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 50)
            .padding(.vertical, 8)
            .background(Color.blue.opacity(0.1))
            .cornerRadius(8)
            
            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(company)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Text(role)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                
                HStack(spacing: 8) {
                    Label(typeIcon, systemImage: typeIcon)
                        .font(.caption2)
                    
                    Text("\(duration) min")
                        .font(.caption2)
                    
                    Text("•")
                        .font(.caption2)
                    
                    Text(timeString(date))
                        .font(.caption2)
                }
                .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            // Actions
            VStack(spacing: 8) {
                Button(action: {}) {
                    Image(systemName: "video.fill")
                        .font(.subheadline)
                }
                
                Button(action: {}) {
                    Image(systemName: "calendar.badge.plus")
                        .font(.subheadline)
                }
            }
            .foregroundStyle(.blue)
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }
    
    private var typeIcon: String {
        switch type {
        case .phone: return "phone.fill"
        case .video: return "video.fill"
        default: return "person.fill"
        }
    }
    
    private func dayString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date).uppercased()
    }
    
    private func dayNumberString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "d"
        return formatter.string(from: date)
    }
    
    private func monthString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        return formatter.string(from: date)
    }
    
    private func timeString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Practice Categories Section

struct PracticeCategoriesSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Practice Questions")
                .font(.headline)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                PracticeCategoryCard(
                    icon: "person.fill",
                    title: "Behavioral",
                    count: 150,
                    color: .blue
                )
                
                PracticeCategoryCard(
                    icon: "cpu.fill",
                    title: "Technical",
                    count: 200,
                    color: .green
                )
                
                PracticeCategoryCard(
                    icon: "lightbulb.fill",
                    title: "Situational",
                    count: 80,
                    color: .orange
                )
                
                PracticeCategoryCard(
                    icon: "building.2.fill",
                    title: "Company",
                    count: 50,
                    color: .purple
                )
            }
        }
    }
}

struct PracticeCategoryCard: View {
    let icon: String
    let title: String
    let count: Int
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title)
                .foregroundStyle(color)
            
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
            
            Text("\(count) questions")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Interview Tips Section

struct InterviewTipsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Interview Tips")
                .font(.headline)
            
            VStack(spacing: 12) {
                TipCard(
                    icon: "checkmark.circle.fill",
                    title: "STAR Method",
                    description: "Use the STAR method to answer behavioral questions",
                    color: .green
                )
                
                TipCard(
                    icon: "clock.fill",
                    title: "Time Management",
                    description: "Practice answering questions in under 2 minutes",
                    color: .orange
                )
                
                TipCard(
                    icon: "hand.wave.fill",
                    title: "Body Language",
                    description: "Maintain eye contact and sit up straight",
                    color: .blue
                )
            }
        }
    }
}

struct TipCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(Color.secondary.opacity(0.05))
        .cornerRadius(12)
    }
}

// MARK: - Mock Interview Section

struct MockInterviewSection: View {
    @State private var showMockInterview = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Mock Interview")
                .font(.headline)
            
            Button(action: {
                showMockInterview = true
            }) {
                HStack {
                    Image(systemName: "video.camera.fill")
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Start AI Mock Interview")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        
                        Text("Practice with our AI interviewer")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.8))
                    }
                    
                    Spacer()
                    
                    Image(systemName: "arrow.right")
                }
                .padding()
                .background(
                    LinearGradient(
                        colors: [.blue, .purple],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .foregroundStyle(.white)
                .cornerRadius(12)
            }
        }
        .sheet(isPresented: $showMockInterview) {
            MockInterviewView()
        }
    }
}

// MARK: - Mock Interview View

struct MockInterviewView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var currentQuestion = 0
    @State private var showAnswer = false
    @State private var answerText = ""
    
    let questions: [InterviewQuestion] = [
        InterviewQuestion(
            id: "1",
            category: .behavioral,
            difficulty: .medium,
            question: "Tell me about a time you had a conflict with a coworker and how you resolved it.",
            sampleAnswer: "When I disagreed with a colleague about the architecture...",
            tips: ["Focus on the resolution", "Show leadership"],
            relatedSkills: ["Communication", "Problem Solving"]
        ),
        InterviewQuestion(
            id: "2",
            category: .technical,
            difficulty: .hard,
            question: "How would you design a scalable notification system?",
            sampleAnswer: "I would use a message queue architecture...",
            tips: ["Consider scalability", "Discuss trade-offs"],
            relatedSkills: ["System Design", "Architecture"]
        )
    ]
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Progress
                HStack {
                    Text("Question \(currentQuestion + 1) of \(questions.count)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Spacer()
                    
                    ProgressView(value: Double(currentQuestion + 1), total: Double(questions.count))
                        .frame(width: 100)
                }
                .padding(.horizontal)
                
                // Question Card
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text(questions[currentQuestion].category.displayName)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.1))
                            .foregroundStyle(.blue)
                            .cornerRadius(4)
                        
                        Text(questions[currentQuestion].difficulty.displayName)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange.opacity(0.1))
                            .foregroundStyle(.orange)
                            .cornerRadius(4)
                    }
                    
                    Text(questions[currentQuestion].question)
                        .font(.headline)
                }
                .padding()
                .background(Color.secondary.opacity(0.05))
                .cornerRadius(12)
                .padding(.horizontal)
                
                // Answer Section
                if showAnswer {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Sample Answer")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        
                        Text(questions[currentQuestion].sampleAnswer ?? "")
                            .font(.body)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(Color.green.opacity(0.05))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                Spacer()
                
                // Tips
                VStack(alignment: .leading, spacing: 8) {
                    Text("Tips")
                        .font(.caption)
                        .fontWeight(.semibold)
                    
                    ForEach(questions[currentQuestion].tips, id: \.self) { tip in
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.caption)
                                .foregroundStyle(.green)
                            Text(tip)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Actions
                HStack(spacing: 12) {
                    Button(action: {
                        showAnswer.toggle()
                    }) {
                        Text(showAnswer ? "Hide Answer" : "Show Answer")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.secondary.opacity(0.1))
                            .cornerRadius(12)
                    }
                    
                    Button(action: {
                        if currentQuestion < questions.count - 1 {
                            currentQuestion += 1
                            showAnswer = false
                            answerText = ""
                        } else {
                            dismiss()
                        }
                    }) {
                        Text(currentQuestion < questions.count - 1 ? "Next" : "Finish")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundStyle(.white)
                            .cornerRadius(12)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Exit") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview

#Preview {
    InterviewPrepView()
}
