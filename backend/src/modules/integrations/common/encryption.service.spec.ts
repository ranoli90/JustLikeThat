// ============ INTEGRATION SERVICE UNIT TESTS ============

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../common/encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-encryption-key-32bytes!!'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string', () => {
      const plaintext = 'Hello, World!';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
    });

    it('should produce different outputs for same input', () => {
      const plaintext = 'Test';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const plaintext = 'Secret Data';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle special characters', () => {
      const plaintext = 'Special chars: !@#$%^&*()_+{}|:"<>?';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Unicode: 你好世界 🎉';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('hash', () => {
    it('should produce a hash', () => {
      const value = 'test-value';
      const hash = service.hash(value);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA-256 produces 64 hex chars
    });

    it('should produce same hash for same input', () => {
      const value = 'consistent';
      const hash1 = service.hash(value);
      const hash2 = service.hash(value);

      expect(hash1).toBe(hash2);
    });
  });

  describe('generateToken', () => {
    it('should generate a token of specified length', () => {
      const token = service.generateToken(32);
      expect(token.length).toBe(64); // Hex encoded = 2x
    });

    it('should generate unique tokens', () => {
      const token1 = service.generateToken();
      const token2 = service.generateToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('encryptObject and decryptObject', () => {
    it('should encrypt and decrypt JSON objects', () => {
      const obj = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
        roles: ['admin', 'user'],
      };

      const encrypted = service.encryptObject(obj);
      const decrypted = service.decryptObject(encrypted);

      expect(decrypted).toEqual(obj);
    });
  });
});

describe('Integration Types', () => {
  it('should define correct integration types', () => {
    const { IntegrationType, SyncType } = require('../common/integration.types');

    expect(IntegrationType.JOB_BOARD).toBe('JOB_BOARD');
    expect(IntegrationType.ATS).toBe('ATS');
    expect(IntegrationType.HRIS).toBe('HRIS');
    expect(IntegrationType.BACKGROUND_CHECK).toBe('BACKGROUND_CHECK');
    expect(IntegrationType.SCHEDULING).toBe('SCHEDULING');
    expect(IntegrationType.LMS).toBe('LMS');
    expect(IntegrationType.TEAM_CHAT).toBe('TEAM_CHAT');
    expect(IntegrationType.SSO).toBe('SSO');
  });

  it('should define correct sync types', () => {
    const { SyncType } = require('../common/integration.types');

    expect(SyncType.FULL).toBe('FULL');
    expect(SyncType.INCREMENTAL).toBe('INCREMENTAL');
    expect(SyncType.MANUAL).toBe('MANUAL');
  });
});
