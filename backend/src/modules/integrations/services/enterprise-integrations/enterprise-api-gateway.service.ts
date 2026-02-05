// ============ ENTERPRISE API GATEWAY SERVICE ============
// Rate Limiting, Authentication, Transformations, API Versioning

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/encryption.service';

export interface APIRateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstSize: number;
}

export interface AuthProvider {
  type: 'oauth2' | 'saml' | 'apiKey' | 'mTLS' | 'basic';
  config: {
    issuer?: string;
    clientId?: string;
    clientSecret?: string;
    audience?: string;
    jwksUri?: string;
    apiKeyHeader?: string;
    certificate?: string;
  };
}

export interface RequestTransformation {
  type: 'header' | 'query' | 'body' | 'path';
  source: string;
  target: string;
  operator: 'add' | 'remove' | 'rename' | 'map' | 'template';
  value?: string;
}

export interface ResponseTransformation {
  type: 'header' | 'body' | 'status';
  source: string;
  target: string;
  operator: 'add' | 'remove' | 'rename' | 'map' | 'filter';
  value?: string;
}

export interface APIVersion {
  version: string;
  status: 'deprecated' | 'active' | 'preview';
  deprecationDate?: Date;
  basePath: string;
  openApiSpecUrl?: string;
}

@Injectable()
export class EnterpriseAPIGatewayService {
  private readonly logger = new Logger(EnterpriseAPIGatewayService.name);
  private rateLimitStore: Map<string, { count: number; resetTime: Date }> = new Map();
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // Rate Limiting
  async configureRateLimit(tenantId: string, config: APIRateLimit): Promise<{ success: boolean; configId?: string }> {
    try {
      this.logger.log(`Configuring rate limits for tenant ${tenantId}`);
      
      const apiConfig = await this.prisma.enterpriseAPIConfig.upsert({
        where: { tenantId },
        update: { rateLimit: config as any },
        create: {
          tenantId,
          rateLimit: config as any,
          authProviders: [] as any,
          transformations: [] as any,
          apiVersions: [] as any,
        },
      });

      return { success: true, configId: apiConfig.id };
    } catch (error) {
      this.logger.error(`Rate limit configuration failed: ${error.message}`);
      return { success: false };
    }
  }

  async checkRateLimit(tenantId: string, endpoint: string, apiKey?: string): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = `${tenantId}:${endpoint}:${apiKey || 'anonymous'}`;
    const now = new Date();
    const resetTime = new Date(now.getTime() + 60000); // Reset every minute

    let current = this.rateLimitStore.get(key);
    if (!current || current.resetTime < now) {
      current = { count: 0, resetTime };
      this.rateLimitStore.set(key, current);
    }

    const config = await this.getAPIConfig(tenantId);
    const limit = config?.rateLimit?.requestsPerMinute || 1000;

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    current.count++;
    return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime };
  }

  async getRateLimitStatus(tenantId: string): Promise<APIRateLimit | null> {
    const config = await this.getAPIConfig(tenantId);
    return config?.rateLimit as APIRateLimit || null;
  }

  // Authentication Providers
  async configureAuthProvider(tenantId: string, provider: AuthProvider): Promise<{ success: boolean; providerId?: string }> {
    try {
      this.logger.log(`Configuring auth provider ${provider.type} for tenant ${tenantId}`);
      
      const config = await this.getAPIConfig(tenantId);
      const providers = config?.authProviders || [];
      
      // Encrypt sensitive config
      if (provider.config.clientSecret) {
        provider.config.clientSecret = await this.encryptionService.encrypt(provider.config.clientSecret);
      }

      providers.push({ ...provider, id: 'provider-' + Date.now() });

      await this.prisma.enterpriseAPIConfig.update({
        where: { tenantId },
        data: { authProviders: providers as any },
      });

      return { success: true, providerId: 'provider-' + Date.now() };
    } catch (error) {
      this.logger.error(`Auth provider configuration failed: ${error.message}`);
      return { success: false };
    }
  }

  async validateOAuth2Token(token: string, tenantId: string): Promise<{ valid: boolean; claims?: any }> {
    try {
      // Validate OAuth2 token
      // In production, validate against authorization server
      this.logger.log(`Validating OAuth2 token for tenant ${tenantId}`);
      
      // Mock validation
      if (token && token.length > 10) {
        return { 
          valid: true, 
          claims: { 
            sub: 'user-123',
            exp: Date.now() + 3600000,
            tenantId,
          } 
        };
      }
      
      return { valid: false };
    } catch (error) {
      this.logger.error(`OAuth2 token validation failed: ${error.message}`);
      return { valid: false };
    }
  }

  async validateAPIKey(apiKey: string, tenantId: string): Promise<{ valid: boolean; apiKeyId?: string }> {
    try {
      // Validate API key
      this.logger.log(`Validating API key for tenant ${tenantId}`);
      
      // Mock validation
      if (apiKey && apiKey.startsWith('sk_')) {
        return { valid: true, apiKeyId: 'key-' + Date.now() };
      }
      
      return { valid: false };
    } catch (error) {
      this.logger.error(`API key validation failed: ${error.message}`);
      return { valid: false };
    }
  }

  async validateSAMLAssertion(assertion: string, tenantId: string): Promise<{ valid: boolean; claims?: any }> {
    try {
      // Validate SAML assertion
      this.logger.log(`Validating SAML assertion for tenant ${tenantId}`);
      
      // Mock validation
      return { valid: true, claims: { tenantId } };
    } catch (error) {
      this.logger.error(`SAML validation failed: ${error.message}`);
      return { valid: false };
    }
  }

  async validateMTLSCertificate(certificate: string, tenantId: string): Promise<{ valid: boolean; commonName?: string }> {
    try {
      // Validate mTLS certificate
      this.logger.log(`Validating mTLS certificate for tenant ${tenantId}`);
      
      // Mock validation
      return { valid: true, commonName: 'client.example.com' };
    } catch (error) {
      this.logger.error(`mTLS validation failed: ${error.message}`);
      return { valid: false };
    }
  }

  // Request/Response Transformation
  async configureTransformation(
    tenantId: string,
    type: 'request' | 'response',
    transformation: RequestTransformation | ResponseTransformation,
  ): Promise<{ success: boolean; transformId?: string }> {
    try {
      this.logger.log(`Configuring ${type} transformation for tenant ${tenantId}`);
      
      const config = await this.getAPIConfig(tenantId);
      const transformations = config?.transformations || { request: [], response: [] };
      
      transformations[type + 's'].push({ ...transformation, id: 'transform-' + Date.now() });

      await this.prisma.enterpriseAPIConfig.update({
        where: { tenantId },
        data: { transformations: transformations as any },
      });

      return { success: true, transformId: 'transform-' + Date.now() };
    } catch (error) {
      this.logger.error(`Transformation configuration failed: ${error.message}`);
      return { success: false };
    }
  }

  async applyRequestTransformations(tenantId: string, request: any): Promise<any> {
    const config = await this.getAPIConfig(tenantId);
    const transformations = config?.transformations?.request || [];
    
    for (const transform of transformations as any[]) {
      // Apply transformation operators
      switch (transform.operator) {
        case 'add':
          request[transform.target] = transform.value || request[transform.source];
          break;
        case 'rename':
          if (request[transform.source] !== undefined) {
            request[transform.target] = request[transform.source];
            delete request[transform.source];
          }
          break;
        case 'remove':
          delete request[transform.source];
          break;
        case 'map':
          // Map values
          break;
      }
    }
    
    return request;
  }

  async applyResponseTransformations(tenantId: string, response: any): Promise<any> {
    const config = await this.getAPIConfig(tenantId);
    const transformations = config?.transformations?.response || [];
    
    for (const transform of transformations as any[]) {
      // Apply transformation operators
      switch (transform.operator) {
        case 'filter':
          // Filter response fields
          break;
        case 'rename':
          if (response[transform.source] !== undefined) {
            response[transform.target] = response[transform.source];
            delete response[transform.source];
          }
          break;
      }
    }
    
    return response;
  }

  // API Versioning
  async configureAPIVersion(tenantId: string, version: APIVersion): Promise<{ success: boolean; versionId?: string }> {
    try {
      this.logger.log(`Configuring API version ${version.version} for tenant ${tenantId}`);
      
      const config = await this.getAPIConfig(tenantId);
      const versions = config?.apiVersions || [];
      
      versions.push({ ...version, id: 'version-' + Date.now() });

      await this.prisma.enterpriseAPIConfig.update({
        where: { tenantId },
        data: { apiVersions: versions as any },
      });

      return { success: true, versionId: 'version-' + Date.now() };
    } catch (error) {
      this.logger.error(`API version configuration failed: ${error.message}`);
      return { success: false };
    }
  }

  async getSupportedVersions(tenantId: string): Promise<APIVersion[]> {
    const config = await this.getAPIConfig(tenantId);
    return (config?.apiVersions || []) as APIVersion[];
  }

  async deprecateAPIVersion(tenantId: string, version: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deprecating API version ${version} for tenant ${tenantId}`);
      
      const config = await this.getAPIConfig(tenantId);
      const versions = (config?.apiVersions || []) as any[];
      
      const updatedVersions = versions.map((v: any) => {
        if (v.version === version) {
          return { ...v, status: 'deprecated', deprecationDate: new Date() };
        }
        return v;
      });

      await this.prisma.enterpriseAPIConfig.update({
        where: { tenantId },
        data: { apiVersions: updatedVersions as any },
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`API version deprecation failed: ${error.message}`);
      return { success: false };
    }
  }

  // API Documentation
  async configureDocumentation(tenantId: string, documentationUrl: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.enterpriseAPIConfig.update({
        where: { tenantId },
        data: { documentation: documentationUrl },
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Documentation configuration failed: ${error.message}`);
      return { success: false };
    }
  }

  async getOpenAPISpec(tenantId: string): Promise<string | null> {
    const config = await this.getAPIConfig(tenantId);
    return config?.documentation || null;
  }

  // Helper methods
  private async getAPIConfig(tenantId: string): Promise<any> {
    return this.prisma.enterpriseAPIConfig.findUnique({
      where: { tenantId },
    });
  }

  async getGatewayConfig(tenantId: string): Promise<any> {
    return this.getAPIConfig(tenantId);
  }

  async updateGatewayConfig(tenantId: string, config: Partial<{
    rateLimit: APIRateLimit;
    authProviders: AuthProvider[];
    transformations: { request: RequestTransformation[]; response: ResponseTransformation[] };
    apiVersions: APIVersion[];
    documentation: string;
  }>): Promise<{ success: boolean }> {
    try {
      await this.prisma.enterpriseAPIConfig.update({
        where: { tenantId },
        data: config as any,
      });
      return { success: true };
    } catch (error) {
      this.logger.error(`Gateway config update failed: ${error.message}`);
      return { success: false };
    }
  }
}
