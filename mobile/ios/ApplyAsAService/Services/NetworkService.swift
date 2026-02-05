//
//  NetworkService.swift
//  ApplyAsAService
//
//  Network layer for API communication
//

import Foundation
import Combine

// MARK: - API Configuration

enum APIConfiguration {
    static let baseURL = URL(string: "https://api.applyasaservice.com/api/v1")!
    static let timeout: TimeInterval = 30
    static let maxRetries = 3
}

// MARK: - API Error

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int, message: String?)
    case decodingError(Error)
    case networkError(Error)
    case unauthorized
    case forbidden
    case notFound
    case serverError
    case offline
    case cancelled
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .httpError(let code, let message):
            return message ?? "HTTP Error: \(code)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized. Please log in again."
        case .forbidden:
            return "Access forbidden"
        case .notFound:
            return "Resource not found"
        case .serverError:
            return "Server error. Please try again later."
        case .offline:
            return "No internet connection"
        case .cancelled:
            return "Request cancelled"
        }
    }
}

// MARK: - HTTP Method

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - API Endpoint

protocol APIEndpoint {
    var path: String { get }
    var method: HTTPMethod { get }
    var headers: [String: String]? { get }
    var queryParameters: [String: String]? { get }
    var body: Data? { get }
}

extension APIEndpoint {
    var headers: [String: String]? { nil }
    var queryParameters: [String: String]? { nil }
    var body: Data? { nil }
}

// MARK: - Endpoints

enum MobileEndpoint: APIEndpoint {
    // Authentication
    case login(email: String, password: String)
    case register(user: RegisterRequest)
    case refreshToken(refreshToken: String)
    case logout
    
    // Biometric Auth
    case registerBiometric(publicKey: String)
    case verifyBiometric(challenge: String)
    
    // Jobs
    case searchJobs(criteria: JobSearchCriteria)
    case getJob(id: String)
    case saveJob(id: String)
    case unsaveJob(id: String)
    case getSavedJobs
    case getJobRecommendations
    
    // Applications
    case getApplications(page: Int, limit: Int)
    case getApplication(id: String)
    case createApplication(request: CreateApplicationRequest)
    case updateApplication(id: String, request: UpdateApplicationRequest)
    case withdrawApplication(id: String)
    
    // Resumes
    case getResumes
    case getResume(id: String)
    case uploadResume(data: Data, filename: String)
    case deleteResume(id: String)
    case setDefaultResume(id: String)
    
    // Interviews
    case getInterviews
    case getInterview(id: String)
    case updateInterview(id: String, request: UpdateInterviewRequest)
    
    // Interview Prep
    case getInterviewQuestions(category: QuestionCategory?, difficulty: Difficulty?)
    case getPracticeQuestions(applicationId: String?)
    case savePracticeAnswer(questionId: String, answer: String)
    
    // Notifications
    case getNotifications(page: Int, limit: Int)
    case markNotificationRead(id: String)
    case markAllNotificationsRead
    case getNotificationPreferences
    case updateNotificationPreferences(preferences: NotificationPreferences)
    
    // Push
    case registerDevice(token: String, platform: String)
    case updateDeviceSettings(id: String, settings: DeviceSettings)
    case deleteDevice(id: String)
    case getDevices
    
    // Sync
    case startSync(lastSyncAt: Date?)
    case getSyncStatus
    case completeSync(syncId: String, changes: [OfflineChange])
    
    // Deep Links
    case generateDeepLink(type: String, id: String)
    case getDeepLink(id: String)
    
    // Widgets
    case getWidgets
    case createWidget(request: CreateWidgetRequest)
    case updateWidget(id: String, request: UpdateWidgetRequest)
    case deleteWidget(id: String)
    
    // Analytics
    case getStoreRatings
    case promptForReview
    
    var path: String {
        switch self {
        case .login:
            return "/mobile/auth/token"
        case .register:
            return "/mobile/auth/register"
        case .refreshToken:
            return "/mobile/auth/token/refresh"
        case .logout:
            return "/mobile/auth/logout"
        case .registerBiometric:
            return "/mobile/auth/biometric/register"
        case .verifyBiometric:
            return "/mobile/auth/biometric/verify"
        case .searchJobs:
            return "/mobile/jobs/search"
        case .getJob(let id):
            return "/mobile/jobs/\(id)"
        case .saveJob(let id):
            return "/mobile/jobs/\(id)/save"
        case .unsaveJob(let id):
            return "/mobile/jobs/\(id)/unsave"
        case .getSavedJobs:
            return "/mobile/jobs/saved"
        case .getJobRecommendations:
            return "/mobile/jobs/recommendations"
        case .getApplications(let page, let limit):
            return "/mobile/applications?page=\(page)&limit=\(limit)"
        case .getApplication(let id):
            return "/mobile/applications/\(id)"
        case .createApplication:
            return "/mobile/applications"
        case .updateApplication(let id, _):
            return "/mobile/applications/\(id)"
        case .withdrawApplication(let id):
            return "/mobile/applications/\(id)/withdraw"
        case .getResumes:
            return "/mobile/resumes"
        case .getResume(let id):
            return "/mobile/resumes/\(id)"
        case .uploadResume:
            return "/mobile/resumes/upload"
        case .deleteResume(let id):
            return "/mobile/resumes/\(id)"
        case .setDefaultResume(let id):
            return "/mobile/resumes/\(id)/default"
        case .getInterviews:
            return "/mobile/interviews"
        case .getInterview(let id):
            return "/mobile/interviews/\(id)"
        case .updateInterview(let id, _):
            return "/mobile/interviews/\(id)"
        case .getInterviewQuestions(let category, let difficulty):
            var query = "/mobile/interview-questions"
            if let category = category {
                query += "?category=\(category.rawValue)"
            }
            if let difficulty = difficulty {
                query += (query.contains("?") ? "&" : "?") + "difficulty=\(difficulty.rawValue)"
            }
            return query
        case .getPracticeQuestions(let applicationId):
            if let id = applicationId {
                return "/mobile/interview-questions/practice?applicationId=\(id)"
            }
            return "/mobile/interview-questions/practice"
        case .savePracticeAnswer:
            return "/mobile/interview-questions/practice/answer"
        case .getNotifications(let page, let limit):
            return "/mobile/notifications?page=\(page)&limit=\(limit)"
        case .markNotificationRead(let id):
            return "/mobile/notifications/\(id)/read"
        case .markAllNotificationsRead:
            return "/mobile/notifications/read-all"
        case .getNotificationPreferences:
            return "/mobile/notifications/preferences"
        case .updateNotificationPreferences:
            return "/mobile/notifications/preferences"
        case .registerDevice:
            return "/mobile/devices/register"
        case .updateDeviceSettings(let id, _):
            return "/mobile/devices/\(id)"
        case .deleteDevice(let id):
            return "/mobile/devices/\(id)"
        case .getDevices:
            return "/mobile/devices"
        case .startSync:
            return "/mobile/sync/start"
        case .getSyncStatus:
            return "/mobile/sync/status"
        case .completeSync:
            return "/mobile/sync/complete"
        case .generateDeepLink:
            return "/mobile/links/generate"
        case .getDeepLink(let id):
            return "/mobile/links/\(id)"
        case .getWidgets:
            return "/mobile/widgets"
        case .createWidget:
            return "/mobile/widgets"
        case .updateWidget(let id, _):
            return "/mobile/widgets/\(id)"
        case .deleteWidget(let id):
            return "/mobile/widgets/\(id)"
        case .getStoreRatings:
            return "/mobile/analytics/store-ratings"
        case .promptForReview:
            return "/mobile/analytics/ratings/prompt"
        }
    }
    
    var method: HTTPMethod {
        switch self {
        case .login, .register, .registerBiometric, .verifyBiometric, .refreshToken,
             .searchJobs, .getJob, .getSavedJobs, .getJobRecommendations,
             .getApplications, .getApplication, .getResumes, .getResume,
             .getInterviews, .getInterview, .getInterviewQuestions, .getPracticeQuestions,
             .getNotifications, .getNotificationPreferences, .getDevices,
             .getSyncStatus, .getDeepLink, .getWidgets, .getStoreRatings:
            return .get
        case .saveJob, .withdrawApplication, .createApplication, .uploadResume,
             .markNotificationRead, .markAllNotificationsRead, .registerDevice,
             .startSync, .generateDeepLink, .createWidget, .promptForReview:
            return .post
        case .updateApplication, .updateInterview, .updateDeviceSettings,
             .savePracticeAnswer, .updateNotificationPreferences, .updateWidget:
            return .put
        case .deleteResume, .deleteDevice, .deleteWidget:
            return .delete
        case .logout:
            return .post
        }
    }
    
    var headers: [String: String]? {
        var headers = ["Content-Type": "application/json", "Accept": "application/json"]
        
        if let token = AuthManager.shared.currentToken {
            headers["Authorization"] = "Bearer \(token)"
        }
        
        return headers
    }
    
    var queryParameters: [String: String]? {
        nil
    }
    
    var body: Data? {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        
        switch self {
        case .register(let request):
            return try? encoder.encode(request)
        case .searchJobs(let criteria):
            return try? encoder.encode(criteria)
        case .createApplication(let request):
            return try? encoder.encode(request)
        case .updateApplication(_, let request):
            return try? encoder.encode(request)
        case .updateInterview(_, let request):
            return try? encoder.encode(request)
        case .updateDeviceSettings(_, let settings):
            return try? encoder.encode(settings)
        case .updateNotificationPreferences(let preferences):
            return try? encoder.encode(preferences)
        case .createWidget(let request):
            return try? encoder.encode(request)
        case .updateWidget(_, let request):
            return try? encoder.encode(request)
        default:
            return nil
        }
    }
}

// MARK: - Network Service

final class NetworkService {
    static let shared = NetworkService()
    
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = APIConfiguration.timeout
        configuration.timeoutIntervalForResource = APIConfiguration.timeout * 2
        configuration.waitsForConnectivity = true
        
        self.session = URLSession(configuration: configuration)
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
    }
    
    func request<T: Decodable>(_ endpoint: APIEndpoint) async throws -> T {
        guard !Task.isCancelled else {
            throw APIError.cancelled
        }
        
        // Check connectivity
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.offline
        }
        
        let request = try buildRequest(for: endpoint)
        let (data, response) = try await performRequest(request)
        
        try validateResponse(response)
        
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
    
    func requestVoid(_ endpoint: APIEndpoint) async throws {
        guard !Task.isCancelled else {
            throw APIError.cancelled
        }
        
        guard NetworkMonitor.shared.isConnected else {
            throw APIError.offline
        }
        
        let request = try buildRequest(for: endpoint)
        let (data, response) = try await performRequest(request)
        
        try validateResponse(response)
        
        if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
            throw APIError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0, 
                                     message: errorResponse.message)
        }
    }
    
    private func buildRequest(for endpoint: APIEndpoint) throws -> URLRequest {
        var urlComponents = URLComponents(url: APIConfiguration.baseURL.appendingPathComponent(endpoint.path), 
                                          resolvingAgainstBaseURL: true)
        
        if let queryParams = endpoint.queryParameters {
            urlComponents?.queryItems = queryParams.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        
        guard let url = urlComponents?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.httpBody = endpoint.body
        
        endpoint.headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
        
        return request
    }
    
    private func performRequest(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }
    }
    
    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        case 500...599:
            throw APIError.serverError
        default:
            throw APIError.httpError(statusCode: httpResponse.statusCode, message: nil)
        }
    }
}

// MARK: - Supporting Types

struct ErrorResponse: Decable {
    let message: String
    let code: String?
}

struct RegisterRequest: Codable {
    let email: String
    let password: String
    let firstName: String
    let lastName: String
}

struct DeviceSettings: Codable {
    let pushEnabled: Bool
    let notificationTypes: [String]
}

struct NotificationPreferences: Codable {
    let jobMatches: Bool
    let applicationUpdates: Bool
    let interviewReminders: Bool
    let messages: Bool
    let weeklyDigest: Bool
}

struct CreateApplicationRequest: Codable {
    let jobId: String
    let resumeId: String?
    let coverLetter: String?
    let notes: String?
}

struct UpdateApplicationRequest: Codable {
    let resumeId: String?
    let coverLetter: String?
    let notes: String?
}

struct UpdateInterviewRequest: Codable {
    let notes: String?
    let feedback: InterviewFeedback?
}

struct CreateWidgetRequest: Codable {
    let widgetType: String
    let config: [String: AnyCodable]
    let refreshInterval: Int
}

struct UpdateWidgetRequest: Codable {
    let config: [String: AnyCodable]?
    let refreshInterval: Int?
}

// MARK: - Auth Manager

final class AuthManager: ObservableObject {
    static let shared = AuthManager()
    
    @Published private(set) var currentUser: User?
    @Published private(set) var currentToken: AuthToken?
    @Published private(set) var isAuthenticated = false
    
    private let keychain = KeychainManager.shared
    
    private init() {
        loadStoredCredentials()
    }
    
    private func loadStoredCredentials() {
        currentToken = keychain.getAuthToken()
        if let token = currentToken, !token.isExpired {
            Task {
                await fetchCurrentUser()
            }
        }
    }
    
    func login(email: String, password: String) async throws {
        let endpoint = MobileEndpoint.login(email: email, password: password)
        let response: AuthResponse = try await NetworkService.shared.request(endpoint)
        
        await MainActor.run {
            self.currentToken = response.token
            self.currentUser = response.user
            self.isAuthenticated = true
            keychain.saveAuthToken(response.token)
        }
    }
    
    func register(email: String, password: String, firstName: String, lastName: String) async throws {
        let request = RegisterRequest(email: email, password: password, firstName: firstName, lastName: lastName)
        let endpoint = MobileEndpoint.register(user: request)
        let response: AuthResponse = try await NetworkService.shared.request(endpoint)
        
        await MainActor.run {
            self.currentToken = response.token
            self.currentUser = response.user
            self.isAuthenticated = true
            keychain.saveAuthToken(response.token)
        }
    }
    
    func logout() async {
        do {
            try await NetworkService.shared.requestVoid(MobileEndpoint.logout)
        } catch {
            print("Logout API call failed: \(error)")
        }
        
        await MainActor.run {
            currentUser = nil
            currentToken = nil
            isAuthenticated = false
            keychain.deleteAuthToken()
            BiometricAuthManager.shared.clearBiometricData()
        }
    }
    
    func refreshTokenIfNeeded() async throws {
        guard let token = currentToken else { return }
        
        if token.isExpired {
            let endpoint = MobileEndpoint.refreshToken(refreshToken: token.refreshToken)
            let response: AuthResponse = try await NetworkService.shared.request(endpoint)
            
            await MainActor.run {
                self.currentToken = response.token
                self.currentUser = response.user
                keychain.saveAuthToken(response.token)
            }
        }
    }
    
    private func fetchCurrentUser() async {
        // Fetch current user profile
        // This would be implemented based on your user endpoint
    }
}

struct AuthResponse: Codable {
    let user: User
    let token: AuthToken
}

// MARK: - Keychain Manager

final class KeychainManager {
    static let shared = KeychainManager()
    
    private let service = "com.applyasaservice"
    
    private init() {}
    
    func saveAuthToken(_ token: AuthToken) {
        guard let data = try? JSONEncoder().encode(token) else { return }
        save(data: data, forKey: "authToken")
    }
    
    func getAuthToken() -> AuthToken? {
        guard let data = load(forKey: "authToken"),
              let token = try? JSONDecoder().decode(AuthToken.self, from: data) else {
            return nil
        }
        return token
    }
    
    func deleteAuthToken() {
        delete(forKey: "authToken")
    }
    
    private func save(data: Data, forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func load(forKey key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else { return nil }
        return result as? Data
    }
    
    private func delete(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Network Monitor

final class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()
    
    @Published private(set) var isConnected = true
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")
    
    private init() {
        startMonitoring()
    }
    
    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }
    
    deinit {
        monitor.cancel()
    }
}
