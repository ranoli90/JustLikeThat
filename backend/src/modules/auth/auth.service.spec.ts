import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notification/email.service';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-token' }));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let emailService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2a$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    role: 'USER',
    isActive: true,
    emailVerified: true,
    onboardingCompleted: false,
    resetPasswordToken: null,
    resetPasswordExpires: null,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    passwordUpdatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
            },
            $transaction: jest.fn((fn) => fn({
              user: {
                findUnique: jest.fn(),
                create: jest.fn().mockResolvedValue(mockUser),
              },
            })),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should reject duplicate email', async () => {
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          user: {
            findUnique: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn(),
          },
        });
      });

      await expect(
        service.signup({ email: 'test@example.com', password: 'password123', firstName: 'Test', lastName: 'User' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject short passwords', async () => {
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn(),
          },
        });
      });

      await expect(
        service.signup({ email: 'new@example.com', password: 'short', firstName: 'Test', lastName: 'User' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user and return tokens on success', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashed');
      prisma.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockUser),
          },
        });
      });

      const result = await service.signup({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should reject invalid email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject deactivated user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe('user-1');
    });
  });

  describe('resetPassword', () => {
    it('should not leak user existence', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.resetPassword({ email: 'nonexistent@example.com' });
      expect(result.message).toContain('If an account exists');
    });

    it('should send reset email for valid user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword({ email: 'test@example.com' });
      expect(result.message).toContain('If an account exists');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com', 'mock-uuid-token');
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should reject expired token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() - 3600000),
      });

      await expect(
        service.resetPasswordWithToken('valid-token', 'newpassword123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password with valid token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      });
      prisma.user.update.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$newhashed');

      const result = await service.resetPasswordWithToken('valid-token', 'newpassword123');
      expect(result.message).toBe('Password reset successfully');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resetPasswordToken: null,
            resetPasswordExpires: null,
          }),
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should reject invalid token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('should verify email with valid token', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        emailVerificationToken: 'valid-token',
        emailVerificationExpires: new Date(Date.now() + 86400000),
      });
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.verifyEmail('valid-token');
      expect(result.message).toBe('Email verified successfully');
    });
  });
});
