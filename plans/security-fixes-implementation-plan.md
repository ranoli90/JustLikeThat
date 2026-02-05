# Security Fixes Implementation Plan

## Overview
This plan outlines the implementation steps to fix critical security vulnerabilities identified during code review.

## Vulnerabilities to Fix

### 1. CRITICAL: Hardcoded ClickHouse Password
**File:** `backend/src/modules/analytics/services/clickhouse.service.ts:15`  
**Impact:** Anyone with repository access can obtain production database credentials  
**Priority:** P0 - Must fix before any deployment

**Implementation:**
1. Remove the hardcoded default password `'clickhouse_admin_123'`
2. Require `CLICKHOUSE_PASSWORD` environment variable
3. Add validation to ensure the environment variable is set
4. Update deployment documentation to specify required environment variables

```typescript
// New implementation
constructor(private configService: ConfigService) {
  const password = this.configService.get<string>('CLICKHOUSE_PASSWORD');
  if (!password) {
    throw new Error('CLICKHOUSE_PASSWORD environment variable is required');
  }
  
  this.client = createClient({
    host: this.configService.get('CLICKHOUSE_HOST', 'http://localhost:8123'),
    username: this.configService.get('CLICKHOUSE_USER', 'admin'),
    password,
    database: this.configService.get('CLICKHOUSE_DATABASE', 'analytics'),
    request_timeout: 30000,
    max_open_connections: 100,
    compression: true,
  });
}
```

---

### 2. CRITICAL: Insecure MFA Verification
**File:** `backend/src/modules/security/services/mfa.service.ts:52`  
**Impact:** MFA can be bypassed with any 6-digit code, completely negating security benefit  
**Priority:** P0 - Must fix before any deployment

**Implementation:**
1. Add `speakeasy` and `@otplib/node11` dependencies
2. Implement proper TOTP verification algorithm
3. Store MFA secrets securely (encrypted at rest)
4. Add time-window tolerance for clock drift
5. Keep backup code verification as-is (it's already secure)

```typescript
import * as speakeasy from 'speakeasy';
import * as crypto from 'crypto';

@Injectable()
export class MfaService {
  private readonly ENCRYPTION_KEY: string;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.ENCRYPTION_KEY = this.configService.get<string>('MFA_ENCRYPTION_KEY') || 
      crypto.randomBytes(32).toString('hex');
  }
  
  private encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.ENCRYPTION_KEY, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${cipher.getAuthTag().toString('hex')}`;
  }
  
  private decryptSecret(encrypted: string): string {
    const [iv, encryptedData, authTag] = encrypted.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm', 
      Buffer.from(this.ENCRYPTION_KEY, 'hex'), 
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
  }

  async verifyMfa(data: { userId: string; code: string; method: string }): Promise<{ success: boolean; message: string }> {
    const mfaData = await this.prisma.mfaSecret.findUnique({
      where: { userId: data.userId }
    });
    
    if (!mfaData) {
      return { success: false, message: 'MFA not set up for this user' };
    }

    // Verify TOTP code
    if (data.method === 'totp' && data.code.length === 6 && /^\d+$/.test(data.code)) {
      const secret = this.decryptSecret(mfaData.encryptedSecret);
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'hex',
        token: data.code,
        window: 1 // Allow 1-minute window for clock drift
      });

      if (verified) {
        await this.prisma.mfaVerificationLog.create({
          data: {
            userId: data.userId,
            method: 'totp',
            success: true,
            timestamp: new Date(),
          }
        });
        return { success: true, message: 'MFA verification successful' };
      }
    }

    // Check backup codes
    const backupCodes = mfaData.backupCodes as string[];
    if (backupCodes.includes(data.code)) {
      const index = backupCodes.indexOf(data.code);
      backupCodes.splice(index, 1);
      
      await this.prisma.mfaSecret.update({
        where: { userId: data.userId },
        data: { backupCodes }
      });
      
      await this.prisma.mfaVerificationLog.create({
        data: {
          userId: data.userId,
          method: 'backup',
          success: true,
          timestamp: new Date(),
        }
      });
      
      return { success: true, message: 'Backup code used successfully' };
    }
    
    // Log failed attempt
    await this.prisma.mfaVerificationLog.create({
      data: {
        userId: data.userId,
        method: data.method,
        success: false,
        timestamp: new Date(),
      }
    });

    return { success: false, message: 'Invalid verification code' };
  }
}
```

---

### 3. CRITICAL: Insecure HMAC Signature Generation
**File:** `backend/src/modules/workflow/services/trigger.service.ts:160`  
**Impact:** Webhook signatures can be easily forged, allowing unauthorized workflow triggers  
**Priority:** P0 - Must fix before any deployment

**Implementation:**
1. Replace simple Base64 concatenation with proper HMAC-SHA256
2. Store webhook secrets encrypted
3. Add signature timestamp validation to prevent replay attacks
4. Implement proper signature format: `t=timestamp,v1=signature`

```typescript
import * as crypto from 'crypto';

@Injectable()
export class TriggerService {
  private readonly HMAC_TIMESTAMP_MAX_AGE = 300000; // 5 minutes
  
  private generateHmacSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
  
  private validateWebhookSignature(
    payload: WebhookPayload,
    secret: string,
    signature?: string,
  ): boolean {
    if (!signature) return false;

    // Parse signature format: t=timestamp,v1=signature
    const parts = signature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));
    
    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = parseInt(timestampPart.substring(2));
    const providedSignature = signaturePart.substring(3);
    
    // Check timestamp to prevent replay attacks
    if (Date.now() - timestamp > this.HMAC_TIMESTAMP_MAX_AGE) {
      return false;
    }

    // Calculate expected signature with timestamp
    const signedPayload = `${timestamp}.${JSON.stringify(payload.body)}`;
    const expectedSignature = this.generateHmacSignature(signedPayload, secret);
    
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature)
    );
  }
}
```

---

### 4. WARNING: Hardcoded JWT Secret Fallback
**File:** `backend/src/modules/mobile/mobile.module.ts:21`  
**Impact:** If environment variable is not set, a weak default secret is used  
**Priority:** P1 - Should fix before production deployment

**Implementation:**
1. Remove the hardcoded fallback
2. Add validation that throws error if JWT_SECRET is not set
3. Update deployment configuration to require JWT_SECRET

```typescript
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  // ...
})
export class MobileModule {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required for MobileModule');
    }
  }
}
```

---

### 5. WARNING: Missing Auth Service Implementations
**File:** `backend/src/modules/auth/auth.service.ts:26-44`  
**Impact:** Critical authentication features are non-functional  
**Priority:** P1 - Should fix before production deployment

**Implementation:**

#### refreshToken()
```typescript
async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    const decoded = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')
    });

    const user = await this.userRepository.findOne({ where: { id: decoded.sub } });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h'
    });

    // Log token refresh
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'TOKEN_REFRESHED',
      resource: 'auth',
      ipAddress: '127.0.0.1', // Should be obtained from request context
      details: { timestamp: new Date().toISOString() }
    });

    return { accessToken };
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

#### resetPassword()
```typescript
async resetPassword(email: string): Promise<{ message: string }> {
  const user = await this.userRepository.findOne({ where: { email } });
  
  // Always return success even if user doesn't exist (prevent user enumeration)
  if (!user) {
    return { message: 'If an account exists, a password reset link has been sent' };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour
  
  // Store hashed reset token (in production, use proper token storage)
  user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
  user.resetPasswordExpires = resetExpires;
  await this.userRepository.save(user);
  
  // Send reset email (implement email service)
  // await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  
  return { message: 'If an account exists, a password reset link has been sent' };
}
```

#### updatePassword()
```typescript
async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    await this.auditService.log({
      tenantId: user.tenantId,
      userId,
      action: 'PASSWORD_UPDATE_FAILED',
      resource: 'auth',
      ipAddress: '127.0.0.1',
      riskLevel: 'high',
      details: { reason: 'Invalid current password' }
    });
    throw new UnauthorizedException('Invalid current password');
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    throw new BadRequestException('New password must be at least 8 characters');
  }
  
  // In production: Add more validation (uppercase, lowercase, numbers, special chars)

  // Update password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordUpdatedAt = new Date();
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await this.userRepository.save(user);
  
  // Invalidate all existing refresh tokens
  // await this.tokenBlacklistService.blacklistUserTokens(userId);

  // Log password change
  await this.auditService.log({
    tenantId: user.tenantId,
    userId,
    action: 'PASSWORD_UPDATED',
    resource: 'auth',
    ipAddress: '127.0.0.1',
    riskLevel: 'high',
    details: { timestamp: new Date().toISOString() }
  });

  return { message: 'Password updated successfully' };
}
```

#### verifyEmail()
```typescript
async verifyEmail(token: string): Promise<{ message: string }> {
  const user = await this.userRepository.findOne({
    where: { emailVerificationToken: token }
  });
  
  if (!user) {
    throw new BadRequestException('Invalid or expired verification token');
  }
  
  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    throw new BadRequestException('Verification token has expired');
  }
  
  user.emailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await this.userRepository.save(user);
  
  await this.auditService.log({
    tenantId: user.tenantId,
    userId: user.id,
    action: 'EMAIL_VERIFIED',
    resource: 'auth',
    ipAddress: '127.0.0.1'
  });
  
  return { message: 'Email verified successfully' };
}
```

---

### 6. WARNING: TypeORM Synchronize Enabled
**File:** `backend/src/app.module.ts:129`  
**Impact:** Auto-sync can cause data loss and security issues in production  
**Priority:** P1 - Should fix before production deployment

**Implementation:**
```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [...],
    synchronize: configService.get<string>('NODE_ENV') !== 'production',
    logging: configService.get<string>('NODE_ENV') !== 'production',
  }),
  inject: [ConfigService],
}),
```

---

## Implementation Order

1. **P0 - Critical (Must fix before deployment):**
   - Fix ClickHouse password (1.1)
   - Fix MFA verification (2.1)
   - Fix HMAC signature (3.1)

2. **P1 - High (Should fix before production):**
   - Fix JWT secret fallback (4.1)
   - Implement missing auth methods (5.1-5.4)
   - Disable TypeORM synchronize (6.1)

3. **P2 - Medium (Can fix in follow-up):**
   - Add comprehensive logging
   - Add unit tests for security functions
   - Add integration tests for auth flows

---

## Dependencies to Add

```json
{
  "dependencies": {
    "speakeasy": "^2.0.0",
    "@otplib/node11": "^12.0.1"
  }
}
```

---

## Testing Strategy

1. **Unit Tests:**
   - MFA TOTP verification with various time offsets
   - HMAC signature generation and validation
   - Password strength validation

2. **Integration Tests:**
   - Full authentication flow (signup → login → MFA → token refresh)
   - Password reset flow
   - Webhook signature validation

3. **Security Tests:**
   - Attempt to bypass MFA with random codes
   - Attempt to forge webhook signatures
   - Verify hardcoded secrets are not present in codebase

---

## Rollback Plan

If any security fix causes issues:
1. ClickHouse: Revert to using default credentials (temporary), then fix properly
2. MFA: Disable MFA requirement via feature flag
3. HMAC: Temporarily disable webhook signature validation (not recommended)
4. Auth methods: Fall back to mock implementations
5. TypeORM: Disable synchronize completely

---

## Related Files to Update

- `backend/package.json` - Add new dependencies
- `backend/.env.example` - Add required environment variables
- `DEPLOYMENT.md` - Document required environment variables
- `backend/src/modules/security/services/mfa.service.ts` - Full rewrite
- `backend/src/modules/workflow/services/trigger.service.ts` - Update signature methods
- `backend/src/modules/auth/auth.service.ts` - Implement missing methods
- `backend/src/modules/analytics/services/clickhouse.service.ts` - Remove hardcoded password
- `backend/src/modules/mobile/mobile.module.ts` - Add JWT validation
- `backend/src/app.module.ts` - Update TypeORM config
