//
//  AuthenticationView.swift
//  ApplyAsAService
//
//  Authentication flow UI with login and registration
//

import SwiftUI

struct AuthenticationView: View {
    @StateObject private var viewModel = AuthViewModel()
    @EnvironmentObject private var authManager: AuthManager
    
    @State private var showRegistration = false
    @State private var showPasswordReset = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Logo and Title
                    VStack(spacing: 16) {
                        Image(systemName: "briefcase.fill")
                            .font(.system(size: 60))
                            .foregroundStyle(.blue)
                        
                        Text("Apply as a Service")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Find your dream job faster")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 40)
                    
                    // Form
                    VStack(spacing: 16) {
                        if showRegistration {
                            // Name Fields
                            HStack(spacing: 12) {
                                CustomTextField(
                                    placeholder: "First Name",
                                    text: $viewModel.firstName,
                                    icon: "person.fill",
                                    keyboardType: .namePhonePad
                                )
                                
                                CustomTextField(
                                    placeholder: "Last Name",
                                    text: $viewModel.lastName,
                                    icon: "person.fill",
                                    keyboardType: .namePhonePad
                                )
                            }
                        }
                        
                        CustomTextField(
                            placeholder: "Email",
                            text: $viewModel.email,
                            icon: "envelope.fill",
                            keyboardType: .emailAddress,
                            autocapitalization: .never
                        )
                        
                        CustomSecureField(
                            placeholder: "Password",
                            text: $viewModel.password
                        )
                        
                        if showRegistration {
                            CustomSecureField(
                                placeholder: "Confirm Password",
                                text: $viewModel.confirmPassword
                            )
                        }
                        
                        if !showRegistration {
                            HStack {
                                Toggle(isOn: $viewModel.rememberMe) {
                                    Text("Remember me")
                                        .font(.subheadline)
                                }
                                .toggleStyle(CheckboxToggleStyle())
                                
                                Spacer()
                                
                                Button("Forgot Password?") {
                                    showPasswordReset = true
                                }
                                .font(.subheadline)
                                .foregroundStyle(.blue)
                            }
                        }
                    }
                    .padding(.horizontal)
                    
                    // Error Message
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundStyle(.red)
                            .padding(.horizontal)
                    }
                    
                    // Action Buttons
                    VStack(spacing: 16) {
                        Button(action: {
                            Task {
                                if showRegistration {
                                    await viewModel.register()
                                } else {
                                    await viewModel.login()
                                }
                            }
                        }) {
                            HStack {
                                if viewModel.authState == .loading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text(showRegistration ? "Create Account" : "Sign In")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(viewModel.isFormValid ? Color.blue : Color.gray)
                            .foregroundStyle(.white)
                            .cornerRadius(12)
                        }
                        .disabled(!viewModel.isFormValid || viewModel.authState == .loading)
                        
                        // Biometric Login
                        if !showRegistration && viewModel.isBiometricAvailable && viewModel.isBiometricEnabled {
                            Button(action: {
                                Task {
                                    await viewModel.authenticateWithBiometrics()
                                }
                            }) {
                                HStack {
                                    Image(systemName: viewModel.biometricType.iconName)
                                    Text("Sign in with \(viewModel.biometricType.displayName)")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.secondary.opacity(0.1))
                                .foregroundStyle(.primary)
                                .cornerRadius(12)
                            }
                        }
                        
                        // Divider
                        HStack {
                            Rectangle()
                                .fill(Color.secondary.opacity(0.3))
                                .frame(height: 1)
                            
                            Text("or")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            
                            Rectangle()
                                .fill(Color.secondary.opacity(0.3))
                                .frame(height: 1)
                        }
                        .padding(.horizontal)
                        
                        // Toggle Auth Mode
                        Button(action: {
                            showRegistration.toggle()
                            viewModel.clearForm()
                        }) {
                            Text(showRegistration ? "Already have an account? Sign In" : "Don't have an account? Sign Up")
                                .font(.subheadline)
                        }
                    }
                    .padding(.horizontal)
                    
                    Spacer(minLength: 40)
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showPasswordReset) {
                PasswordResetView()
            }
            .onChange(of: authManager.isAuthenticated) { _, isAuthenticated in
                if isAuthenticated {
                    // Navigate to main app
                }
            }
        }
    }
}

// MARK: - Custom Text Field

struct CustomTextField: View {
    let placeholder: String
    @Binding var text: String
    let icon: String
    var keyboardType: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 20)
            
            TextField(placeholder, text: $text)
                .keyboardType(keyboardType)
                .textInputAutocapitalization(autocapitalization)
                .autocorrectionDisabled()
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Custom Secure Field

struct CustomSecureField: View {
    let placeholder: String
    @Binding var text: String
    @State private var isSecure = true
    
    var body: some View {
        HStack {
            Image(systemName: "lock.fill")
                .foregroundStyle(.secondary)
                .frame(width: 20)
            
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
            }
            
            Button(action: {
                isSecure.toggle()
            }) {
                Image(systemName: isSecure ? "eye.slash" : "eye")
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Checkbox Toggle Style

struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 8) {
            Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                .foregroundStyle(configuration.isOn ? .blue : .secondary)
                .font(.subheadline)
            
            configuration.label
        }
        .onTapGesture {
            configuration.isOn.toggle()
        }
    }
}

// MARK: - Password Reset View

struct PasswordResetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var showConfirmation = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text("Reset Password")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Enter your email address and we'll send you a link to reset your password.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                
                CustomTextField(
                    placeholder: "Email",
                    text: $email,
                    icon: "envelope.fill",
                    keyboardType: .emailAddress,
                    autocapitalization: .never
                )
                .padding(.horizontal)
                
                Button("Send Reset Link") {
                    showConfirmation = true
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(email.isEmpty ? Color.gray : Color.blue)
                .foregroundStyle(.white)
                .cornerRadius(12)
                .padding(.horizontal)
                .disabled(email.isEmpty)
                
                Spacer()
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Reset Link Sent", isPresented: $showConfirmation) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text("Check your email for a password reset link.")
            }
        }
    }
}

// MARK: - Preview

#Preview {
    AuthenticationView()
        .environmentObject(AuthManager.shared)
}
