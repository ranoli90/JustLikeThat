//
//  BiometricAuthManager.swift
//  ApplyAsAService
//
//  Biometric authentication using Face ID / Touch ID
//

import Foundation
import LocalAuthentication
import Security

// MARK: - Biometric Type

enum BiometricType {
    case none
    case touchID
    case faceID
    
    var displayName: String {
        switch self {
        case .none: return "None"
        case .touchID: return "Touch ID"
        case .faceID: return "Face ID"
        }
    }
    
    var iconName: String {
        switch self {
        case .none: return "lock.slash"
        case .touchID: return "touchid"
        case .faceID: return "faceid"
        }
    }
}

// MARK: - Biometric Error

enum BiometricError: LocalizedError {
    case notAvailable
    case notEnrolled
    case lockout
    case userCancel
    case userFallback
    case authenticationFailed
    case keyGenerationFailed
    case keyStorageFailed
    case keyRetrievalFailed
    case signatureFailed
    case publicKeyRegistrationFailed
    
    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "Biometric authentication is not available on this device"
        case .notEnrolled:
            return "No biometric data enrolled. Please set up Face ID or Touch ID in Settings"
        case .lockout:
            return "Biometric authentication is locked. Please use your device passcode"
        case .userCancel:
            return "Authentication was cancelled"
        case .userFallback:
            return "User chose to use fallback authentication"
        case .authenticationFailed:
            return "Authentication failed"
        case .keyGenerationFailed:
            return "Failed to generate cryptographic keys"
        case .keyStorageFailed:
            return "Failed to store cryptographic keys"
        case .keyRetrievalFailed:
            return "Failed to retrieve cryptographic keys"
        case .signatureFailed:
            return "Failed to create biometric signature"
        case .publicKeyRegistrationFailed:
            return "Failed to register public key with server"
        }
    }
}

// MARK: - Biometric Auth Manager

final class BiometricAuthManager: ObservableObject {
    static let shared = BiometricAuthManager()
    
    @Published private(set) var isBiometricAvailable = false
    @Published private(set) var biometricType: BiometricType = .none
    @Published private(set) var isBiometricEnabled = false
    @Published private(set) var publicKey: SecKey?
    
    private let context = LAContext()
    
    private init() {
        checkBiometricAvailability()
    }
    
    func checkBiometricAvailability() {
        var error: NSError?
        let canAuthenticate = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        
        if canAuthenticate {
            isBiometricAvailable = true
            biometricType = context.biometryType == .faceID ? .faceID : .touchID
        } else {
            isBiometricAvailable = false
            biometricType = .none
            
            if let error = error {
                print("Biometric availability error: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - Biometric Enrollment
    
    func enrollBiometric() async throws -> String {
        guard isBiometricAvailable else {
            throw BiometricError.notAvailable
        }
        
        // Generate key pair
        let (privateKey, publicKey) = try generateKeyPair()
        self.publicKey = publicKey
        
        // Get public key data
        guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
            throw BiometricError.keyRetrievalFailed
        }
        
        // Register public key with server
        let publicKeyBase64 = publicKeyData.base64EncodedString()
        
        let endpoint = MobileEndpoint.registerBiometric(publicKey: publicKeyBase64)
        let response: BiometricRegistrationResponse = try await NetworkService.shared.request(endpoint)
        
        // Store key reference locally
        try storeKeyReference(privateKey: privateKey)
        
        await MainActor.run {
            isBiometricEnabled = true
        }
        
        return response.challenge
    }
    
    // MARK: - Biometric Verification
    
    func verifyBiometric(challenge: String) async throws -> Bool {
        guard isBiometricAvailable else {
            throw BiometricError.notAvailable
        }
        
        // Retrieve key reference
        guard let privateKey = retrieveKeyReference() else {
            throw BiometricError.keyRetrievalFailed
        }
        
        // Create signature
        let challengeData = challenge.data(using: .utf8)!
        var error: Unmanaged<CFError>?
        
        guard let signature = SecKeyCreateSignature(
            privateKey,
            .ecdsaSignatureMessageX962SHA256,
            challengeData as CFData,
            &error
        ) as Data? else {
            throw BiometricError.signatureFailed
        }
        
        // Verify with server
        let signatureBase64 = signature.base64EncodedString()
        
        let endpoint = MobileEndpoint.verifyBiometric(challenge: signatureBase64)
        let response: BiometricVerificationResponse = try await NetworkService.shared.request(endpoint)
        
        return response.verified
    }
    
    func authenticateWithBiometrics(reason: String) async throws -> Bool {
        let context = LAContext()
        context.localizedCancelTitle = "Cancel"
        context.localizedFallbackTitle = "Use Passcode"
        
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            if let error = error {
                switch LAError.Code(rawValue: error.code) {
                case .biometryNotEnrolled:
                    throw BiometricError.notEnrolled
                case .biometryLockout:
                    throw BiometricError.lockout
                case .userCancel:
                    throw BiometricError.userCancel
                case .userFallback:
                    throw BiometricError.userFallback
                default:
                    throw BiometricError.authenticationFailed
                }
            }
            throw BiometricError.notAvailable
        }
        
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            return success
        } catch {
            throw BiometricError.authenticationFailed
        }
    }
    
    // MARK: - Key Management
    
    private func generateKeyPair() throws -> (privateKey: SecKey, publicKey: SecKey) {
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: "com.applyasaservice.biometric.key".data(using: .utf8)!
            ]
        ]
        
        var error: Unmanaged<CFError>?
        
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            throw BiometricError.keyGenerationFailed
        }
        
        guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
            throw BiometricError.keyGenerationFailed
        }
        
        return (privateKey, publicKey)
    }
    
    private func storeKeyReference(privateKey: SecKey) throws {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.applyasaservice.biometric",
            kSecAttrAccount as String: "privatekey",
            kSecValueRef as String: privateKey,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw BiometricError.keyStorageFailed
        }
    }
    
    private func retrieveKeyReference() -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.applyasaservice.biometric",
            kSecAttrAccount as String: "privatekey",
            kSecReturnRef as String: true
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess, let key = result as? SecKey else {
            return nil
        }
        
        return key
    }
    
    // MARK: - Disable Biometric
    
    func disableBiometric() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "com.applyasaservice.biometric"
        ]
        
        SecItemDelete(query as CFDictionary)
        
        Task { @MainActor in
            isBiometricEnabled = false
            publicKey = nil
        }
    }
    
    func clearBiometricData() {
        disableBiometric()
    }
}

// MARK: - Response Types

struct BiometricRegistrationResponse: Codable {
    let challenge: String
    let registeredAt: Date
}

struct BiometricVerificationResponse: Codable {
    let verified: Bool
    let timestamp: Date
}
