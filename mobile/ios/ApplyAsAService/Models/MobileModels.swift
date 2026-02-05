//
//  MobileModels.swift
//  ApplyAsAService
//
//  Data models for the mobile application
//

import Foundation

// MARK: - User Models

struct User: Identifiable, Codable {
    let id: String
    let email: String
    let firstName: String
    let lastName: String
    let avatarURL: String?
    let createdAt: Date
    let updatedAt: Date
    
    var fullName: String {
        "\(firstName) \(lastName)"
    }
}

struct AuthToken: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let tokenType: String
    
    var isExpired: Bool {
        Date() >= expiresAt
    }
}

// MARK: - Job Models

struct JobPosting: Identifiable, Codable {
    let id: String
    let title: String
    let company: Company
    let location: Location
    let jobType: JobType
    let description: String
    let requirements: [String]
    let salaryRange: SalaryRange?
    let applicationDeadline: Date?
    let postedAt: Date
    let remoteType: RemoteType
    let skills: [String]
    let benefits: [String]
    let applicationCount: Int
    let isSaved: Bool
}

struct Company: Identifiable, Codable {
    let id: String
    let name: String
    let logoURL: String?
    let website: String?
    let size: CompanySize
    let industry: String
}

struct Location: Codable {
    let city: String
    let state: String?
    let country: String
    let zipCode: String?
    let coordinates: Coordinates?
}

struct Coordinates: Codable {
    let latitude: Double
    let longitude: Double
}

struct SalaryRange: Codable {
    let min: Double
    let max: Double
    let currency: String
    let period: SalaryPeriod
}

enum JobType: String, Codable, CaseIterable {
    case fullTime = "full_time"
    case partTime = "part_time"
    case contract = "contract"
    case internship = "internship"
    case temporary = "temporary"
    
    var displayName: String {
        switch self {
        case .fullTime: return "Full-time"
        case .partTime: return "Part-time"
        case .contract: return "Contract"
        case .internship: return "Internship"
        case .temporary: return "Temporary"
        }
    }
}

enum RemoteType: String, Codable, CaseIterable {
    case onSite = "on_site"
    case hybrid = "hybrid"
    case remote = "remote"
    
    var displayName: String {
        switch self {
        case .onSite: return "On-site"
        case .hybrid: return "Hybrid"
        case .remote: return "Remote"
        }
    }
}

enum CompanySize: String, Codable {
    case startup = "startup"
    case small = "small"
    case medium = "medium"
    case large = "large"
    case enterprise = "enterprise"
}

enum SalaryPeriod: String, Codable {
    case hourly = "hourly"
    case monthly = "monthly"
    case yearly = "yearly"
}

// MARK: - Application Models

struct JobApplication: Identifiable, Codable {
    let id: String
    let job: JobPosting
    let status: ApplicationStatus
    let appliedAt: Date
    let updatedAt: Date
    let resume: Resume?
    let coverLetter: String?
    let notes: String?
    let interviewCount: Int
    let documents: [Document]
    
    var statusProgress: Double {
        switch status {
        case .draft: return 0.1
        case .submitted: return 0.25
        case .screening: return 0.4
        case .interview: return 0.6
        case .assessment: return 0.75
        case .offer: return 0.9
        case .hired: return 1.0
        case .rejected: return 1.0
        case .withdrawn: return 1.0
        }
    }
}

enum ApplicationStatus: String, Codable, CaseIterable {
    case draft = "draft"
    case submitted = "submitted"
    case screening = "screening"
    case interview = "interview"
    case assessment = "assessment"
    case offer = "offer"
    case hired = "hired"
    case rejected = "rejected"
    case withdrawn = "withdrawn"
    
    var displayName: String {
        switch self {
        case .draft: return "Draft"
        case .submitted: return "Submitted"
        case .screening: return "Screening"
        case .interview: return "Interview"
        case .assessment: return "Assessment"
        case .offer: return "Offer"
        case .hired: return "Hired"
        case .rejected: return "Rejected"
        case .withdrawn: return "Withdrawn"
        }
    }
    
    var color: String {
        switch self {
        case .draft: return "gray"
        case .submitted: return "blue"
        case .screening: return "indigo"
        case .interview: return "purple"
        case .assessment: return "orange"
        case .offer: return "green"
        case .hired: return "green"
        case .rejected: return "red"
        case .withdrawn: return "gray"
        }
    }
}

// MARK: - Resume Models

struct Resume: Identifiable, Codable {
    let id: String
    let userId: String
    let title: String
    let fileURL: String
    let fileType: String
    let fileSize: Int
    let createdAt: Date
    let updatedAt: Date
    let isDefault: Bool
    let parsedData: ParsedResumeData?
}

struct ParsedResumeData: Codable {
    let fullName: String?
    let email: String?
    let phone: String?
    let summary: String?
    let experience: [WorkExperience]
    let education: [Education]
    let skills: [String]
    let certifications: [Certification]
}

struct WorkExperience: Identifiable, Codable {
    let id: String
    let company: String
    let title: String
    let startDate: Date
    let endDate: Date?
    let current: Bool
    let description: String?
    let location: String?
}

struct Education: Identifiable, Codable {
    let id: String
    let institution: String
    let degree: String
    let field: String
    let startDate: Date
    let endDate: Date?
    let current: Bool
    let gpa: Double?
}

struct Certification: Identifiable, Codable {
    let id: String
    let name: String
    let issuer: String
    let issueDate: Date
    let expiryDate: Date?
    let credentialId: String?
}

struct Document: Identifiable, Codable {
    let id: String
    let name: String
    let fileURL: String
    let fileType: String
    let fileSize: Int
    let uploadedAt: Date
}

// MARK: - Interview Models

struct InterviewSession: Identifiable, Codable {
    let id: String
    let applicationId: String
    let type: InterviewType
    let scheduledAt: Date
    let duration: Int // minutes
    let location: String?
    let meetingURL: String?
    let interviewers: [Interviewer]
    let notes: String?
    let feedback: InterviewFeedback?
}

enum InterviewType: String, Codable, CaseIterable {
    case phone = "phone"
    case video = "video"
    case onsite = "onsite"
    case technical = "technical"
    case behavioral = "behavioral"
    case panel = "panel"
    
    var displayName: String {
        switch self {
        case .phone: return "Phone Screen"
        case .video: return "Video Interview"
        case .onsite: return "On-site Interview"
        case .technical: return "Technical Interview"
        case .behavioral: return "Behavioral Interview"
        case .panel: return "Panel Interview"
        }
    }
}

struct Interviewer: Identifiable, Codable {
    let id: String
    let name: String
    let title: String?
    let email: String?
    let photoURL: String?
}

struct InterviewFeedback: Codable {
    let overallRating: Int
    let strengths: [String]
    let areasForImprovement: [String]
    let notes: String?
    let recommendation: String
}

// MARK: - Interview Prep Models

struct InterviewQuestion: Identifiable, Codable {
    let id: String
    let category: QuestionCategory
    let difficulty: Difficulty
    let question: String
    let sampleAnswer: String?
    let tips: [String]
    let relatedSkills: [String]
}

enum QuestionCategory: String, Codable, CaseIterable {
    case behavioral = "behavioral"
    case technical = "technical"
    case situational = "situational"
    case companySpecific = "company_specific"
    case general = "general"
    
    var displayName: String {
        switch self {
        case .behavioral: return "Behavioral"
        case .technical: return "Technical"
        case .situational: return "Situational"
        case .companySpecific: return "Company-Specific"
        case .general: return "General"
        }
    }
}

enum Difficulty: String, Codable, CaseIterable {
    case easy = "easy"
    case medium = "medium"
    case hard = "hard"
    
    var displayName: String {
        switch self {
        case .easy: return "Easy"
        case .medium: return "Medium"
        case .hard: return "Hard"
        }
    }
}

// MARK: - Search Models

struct JobSearchCriteria: Codable {
    var query: String?
    var location: Location?
    var jobTypes: [JobType]
    var remoteTypes: [RemoteType]
    var salaryMin: Double?
    var salaryMax: Double?
    var experienceLevels: [ExperienceLevel]
    var skills: [String]
    var industries: [String]
    var companySizes: [CompanySize]
    var postedWithin: PostedWithin?
    var page: Int
    var limit: Int
    var sortBy: SortOption
    var sortOrder: SortOrder
}

enum ExperienceLevel: String, Codable, CaseIterable {
    case entry = "entry"
    case mid = "mid"
    case senior = "senior"
    case lead = "lead"
    case executive = "executive"
    
    var displayName: String {
        switch self {
        case .entry: return "Entry Level"
        case .mid: return "Mid Level"
        case .senior: return "Senior Level"
        case .lead: return "Lead"
        case .executive: return "Executive"
        }
    }
}

enum PostedWithin: String, Codable, CaseIterable {
    case day = "day"
    case week = "week"
    case twoWeeks = "two_weeks"
    case month = "month"
    
    var displayName: String {
        switch self {
        case .day: return "Past 24 hours"
        case .week: return "Past week"
        case .twoWeeks: return "Past 2 weeks"
        case .month: return "Past month"
        }
    }
}

enum SortOption: String, Codable, CaseIterable {
    case relevance = "relevance"
    case date = "date"
    case salary = "salary"
    case distance = "distance"
    
    var displayName: String {
        switch self {
        case .relevance: return "Relevance"
        case .date: return "Date"
        case .salary: return "Salary"
        case .distance: return "Distance"
        }
    }
}

enum SortOrder: String, Codable {
    case asc = "asc"
    case desc = "desc"
}

struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let page: Int
    let limit: Int
    let totalItems: Int
    let totalPages: Int
    let hasNext: Bool
    let hasPrevious: Bool
}

// MARK: - Notification Models

struct PushNotification: Identifiable, Codable {
    let id: String
    let title: String
    let body: String
    let type: NotificationType
    let data: [String: String]
    let createdAt: Date
    let read: Bool
}

enum NotificationType: String, Codable {
    case jobMatch = "job_match"
    case applicationUpdate = "application_update"
    case interviewReminder = "interview_reminder"
    case newMessage = "new_message"
    case savedJobUpdate = "saved_job_update"
    case system = "system"
}

// MARK: - Sync Models

struct SyncStatus: Codable {
    let lastSyncAt: Date?
    let pendingChanges: Int
    let syncInProgress: Bool
    let error: String?
}

struct OfflineChange: Identifiable, Codable {
    let id: String
    let entityType: String
    let entityId: String
    let operation: SyncOperation
    let data: [String: AnyCodable]
    let createdAt: Date
    let syncedAt: Date?
}

enum SyncOperation: String, Codable {
    case create = "create"
    case update = "update"
    case delete = "delete"
}

struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues { $0.value }
        } else if container.decodeNil() {
            value = NSNull()
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unable to decode value"
            )
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        case is NSNull:
            try container.encodeNil()
        default:
            throw EncodingError.invalidValue(
                value,
                EncodingError.Context(codingPath: encoder.codingPath, debugDescription: "Unable to encode value")
            )
        }
    }
}
