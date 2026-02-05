//
//  AuthViewModel.swift
//  ApplyAsAService
//
//  Authentication ViewModel using MVVM with Combine
//

import Foundation
import Combine
import SwiftUI

// MARK: - Auth State

enum AuthState {
    case idle
    case loading
    case authenticated
    case unauthenticated
    case error(String)
}

// MARK: - Auth ViewModel

@MainActor
final class AuthViewModel: ObservableObject {
    // MARK: - Published Properties
    
    @Published var authState: AuthState = .idle
    @Published var email = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var rememberMe = false
    @Published var showBiometricPrompt = false
    @Published var errorMessage: String?
    @Published var isFormValid = false
    
    // MARK: - Biometric
    
    @Published var biometricType: BiometricType = .none
    @Published var isBiometricAvailable = false
    @Published var isBiometricEnabled = false
    
    // MARK: - Private Properties
    
    private var cancellables = Set<AnyCancellable>()
    private let authManager = AuthManager.shared
    private let biometricManager = BiometricAuthManager.shared
    
    // MARK: - Form Validation
    
    private var emailPublisher: AnyPublisher<Bool, Never> {
        $email
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .map { email in
                let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
                return email.range(of: emailRegex, options: .regularExpression) != nil
            }
            .eraseToAnyPublisher()
    }
    
    private var passwordPublisher: AnyPublisher<Bool, Never> {
        $password
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .map { password in
                password.count >= 8
            }
            .eraseToAnyPublisher()
    }
    
    private var confirmPasswordPublisher: AnyPublisher<Bool, Never> {
        Publishers.CombineLatest($password, $confirmPassword)
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .map { password, confirmPassword in
                password == confirmPassword && !confirmPassword.isEmpty
            }
            .eraseToAnyPublisher()
    }
    
    private var namePublisher: AnyPublisher<Bool, Never> {
        Publishers.CombineLatest($firstName, $lastName)
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .map { firstName, lastName in
                !firstName.trimmingCharacters(in: .whitespaces).isEmpty &&
                !lastName.trimmingCharacters(in: .whitespaces).isEmpty
            }
            .eraseToAnyPublisher()
    }
    
    // MARK: - Initialization
    
    init() {
        setupValidation()
        checkBiometricStatus()
    }
    
    private func setupValidation() {
        Publishers.CombineLatest4(emailPublisher, passwordPublisher, confirmPasswordPublisher, namePublisher)
            .receive(on: DispatchQueue.main)
            .map { emailValid, passwordValid, confirmValid, nameValid in
                emailValid && passwordValid && confirmValid && nameValid
            }
            .assign(to: &$isFormValid)
    }
    
    private func checkBiometricStatus() {
        biometricType = biometricManager.biometricType
        isBiometricAvailable = biometricManager.isBiometricAvailable
        isBiometricEnabled = biometricManager.isBiometricEnabled
    }
    
    // MARK: - Login
    
    func login() async {
        guard isFormValid else {
            errorMessage = "Please fill in all fields correctly"
            return
        }
        
        authState = .loading
        errorMessage = nil
        
        do {
            try await authManager.login(email: email, password: password)
            authState = .authenticated
        } catch {
            authState = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Registration
    
    func register() async {
        guard isFormValid else {
            errorMessage = "Please fill in all fields correctly"
            return
        }
        
        authState = .loading
        errorMessage = nil
        
        do {
            try await authManager.register(
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName
            )
            authState = .authenticated
        } catch {
            authState = .error(error.localizedDescription)
            errorMessage = error.localizedDescription
        }
    }
    
    // MARK: - Logout
    
    func logout() async {
        authState = .loading
        await authManager.logout()
        authState = .unauthenticated
    }
    
    // MARK: - Biometric Authentication
    
    func requestBiometricEnrollment() async {
        do {
            let challenge = try await biometricManager.enrollBiometric()
            // The challenge would be verified with the server
            isBiometricEnabled = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    func authenticateWithBiometrics() async {
        guard isBiometricAvailable && isBiometricEnabled else {
            return
        }
        
        do {
            let success = try await biometricManager.authenticateWithBiometrics(
                reason: "Authenticate to access your job applications"
            )
            
            if success {
                // Perform silent login with biometric
                await loginWithBiometric()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
    
    private func loginWithBiometric() async {
        authState = .loading
        
        // This would use the stored biometric credentials
        // to perform a silent login
        do {
            // Implementation would verify biometric signature with server
            authState = .authenticated
        } catch {
            authState = .error(error.localizedDescription)
        }
    }
    
    func disableBiometric() {
        biometricManager.disableBiometric()
        isBiometricEnabled = false
    }
    
    // MARK: - Password Reset
    
    func resetPassword(email: String) async throws {
        // Implementation for password reset
    }
    
    // MARK: - Form Actions
    
    func clearForm() {
        email = ""
        password = ""
        confirmPassword = ""
        firstName = ""
        lastName = ""
        errorMessage = nil
    }
    
    func toggleRememberMe() {
        rememberMe.toggle()
    }
}
