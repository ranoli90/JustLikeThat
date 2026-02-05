//
//  ApplyAsAServiceTests.swift
//  ApplyAsAServiceTests
//
//  Unit tests for iOS mobile application
//

import XCTest
@testable import ApplyAsAService

final class ApplyAsAServiceTests: XCTestCase {
    
    // MARK: - Auth Tests
    
    func testAuthTokenExpiry() {
        let futureDate = Date().addingTimeInterval(3600)
        let token = AuthToken(
            accessToken: "test_access",
            refreshToken: "test_refresh",
            expiresAt: futureDate,
            tokenType: "Bearer"
        )
        
        XCTAssertFalse(token.isExpired)
    }
    
    func testAuthTokenExpired() {
        let pastDate = Date().addingTimeInterval(-3600)
        let token = AuthToken(
            accessToken: "test_access",
            refreshToken: "test_refresh",
            expiresAt: pastDate,
            tokenType: "Bearer"
        )
        
        XCTAssertTrue(token.isExpired)
    }
    
    func testUserFullName() {
        let user = User(
            id: "1",
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            avatarURL: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        XCTAssertEqual(user.fullName, "John Doe")
    }
    
    // MARK: - Job Tests
    
    func testJobPosting() {
        let job = JobPosting(
            id: "1",
            title: "Senior iOS Developer",
            company: Company(
                id: "1",
                name: "TechCorp",
                logoURL: nil,
                website: "https://techcorp.com",
                size: .large,
                industry: "Technology"
            ),
            location: Location(
                city: "San Francisco",
                state: "CA",
                country: "USA",
                zipCode: "94102",
                coordinates: nil
            ),
            jobType: .fullTime,
            description: "We are looking for a Senior iOS Developer...",
            requirements: ["Swift", "SwiftUI"],
            salaryRange: SalaryRange(
                min: 150000,
                max: 200000,
                currency: "USD",
                period: .yearly
            ),
            applicationDeadline: nil,
            postedAt: Date(),
            remoteType: .hybrid,
            skills: ["Swift", "SwiftUI", "iOS"],
            benefits: ["Health Insurance", "401k"],
            applicationCount: 45,
            isSaved: false
        )
        
        XCTAssertEqual(job.title, "Senior iOS Developer")
        XCTAssertEqual(job.jobType, .fullTime)
        XCTAssertFalse(job.isSaved)
    }
    
    // MARK: - Application Tests
    
    func testApplicationStatusProgress() {
        let job = sampleJob
        let application = JobApplication(
            id: "1",
            job: job,
            status: .interview,
            appliedAt: Date(),
            updatedAt: Date(),
            resume: nil,
            coverLetter: nil,
            notes: nil,
            interviewCount: 1,
            documents: []
        )
        
        XCTAssertEqual(application.statusProgress, 0.6)
    }
    
    // MARK: - Search Criteria Tests
    
    func testDefaultSearchCriteria() {
        let criteria = JobSearchCriteria(
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
        
        XCTAssertEqual(criteria.page, 1)
        XCTAssertEqual(criteria.limit, 20)
        XCTAssertEqual(criteria.sortBy, .relevance)
    }
    
    // MARK: - Interview Question Tests
    
    func testInterviewQuestionDifficulty() {
        let question = InterviewQuestion(
            id: "1",
            category: .behavioral,
            difficulty: .medium,
            question: "Tell me about a challenge you faced.",
            sampleAnswer: "I once had a challenging project...",
            tips: ["Be specific", "Show problem-solving"],
            relatedSkills: ["Communication"]
        )
        
        XCTAssertEqual(question.difficulty, .medium)
        XCTAssertEqual(question.category, .behavioral)
    }
    
    // MARK: - Pagination Tests
    
    func testPaginatedResponse() {
        let jobs = [sampleJob, sampleJob, sampleJob]
        let response = PaginatedResponse(
            items: jobs,
            page: 1,
            limit: 20,
            totalItems: 100,
            totalPages: 5,
            hasNext: true,
            hasPrevious: false
        )
        
        XCTAssertEqual(response.items.count, 3)
        XCTAssertTrue(response.hasNext)
        XCTAssertFalse(response.hasPrevious)
        XCTAssertEqual(response.totalPages, 5)
    }
    
    // MARK: - Notification Type Tests
    
    func testNotificationTypes() {
        let jobMatch = NotificationType.jobMatch
        XCTAssertEqual(jobMatch.rawValue, "job_match")
        
        let interviewReminder = NotificationType.interviewReminder
        XCTAssertEqual(interviewReminder.rawValue, "interview_reminder")
    }
    
    // MARK: - Biometric Type Tests
    
    func testBiometricTypeDisplayName() {
        XCTAssertEqual(BiometricType.faceID.displayName, "Face ID")
        XCTAssertEqual(BiometricType.touchID.displayName, "Touch ID")
        XCTAssertEqual(BiometricType.none.displayName, "None")
    }
    
    // MARK: - Sync Operation Tests
    
    func testSyncOperationTypes() {
        XCTAssertEqual(SyncOperation.create.rawValue, "create")
        XCTAssertEqual(SyncOperation.update.rawValue, "update")
        XCTAssertEqual(SyncOperation.delete.rawValue, "delete")
    }
}

// MARK: - Helper Properties

extension ApplyAsAServiceTests {
    var sampleJob: JobPosting {
        JobPosting(
            id: "1",
            title: "Senior iOS Developer",
            company: Company(
                id: "1",
                name: "TechCorp",
                logoURL: nil,
                website: "https://techcorp.com",
                size: .large,
                industry: "Technology"
            ),
            location: Location(
                city: "San Francisco",
                state: "CA",
                country: "USA",
                zipCode: "94102",
                coordinates: nil
            ),
            jobType: .fullTime,
            description: "We are looking for a Senior iOS Developer...",
            requirements: ["Swift", "SwiftUI"],
            salaryRange: SalaryRange(
                min: 150000,
                max: 200000,
                currency: "USD",
                period: .yearly
            ),
            applicationDeadline: nil,
            postedAt: Date(),
            remoteType: .hybrid,
            skills: ["Swift", "SwiftUI", "iOS"],
            benefits: ["Health Insurance", "401k"],
            applicationCount: 45,
            isSaved: false
        )
    }
}
