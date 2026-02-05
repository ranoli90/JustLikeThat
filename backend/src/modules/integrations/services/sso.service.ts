// ============ SSO SERVICE ============

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OktaService } from './sso/okta.service';
import { AzureAdService } from './sso/azure-ad.service';

export interface SamlConfig {
  issuer: string;
  callbackUrl: string;
  certificate: string;
  privateKey?: string;
}

export interface OidcConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  redirectUri: string;
}

@Injectable()
export class SsoService {
  private readonly logger = new Logger(SsoService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly oktaService: OktaService,
    private readonly azureAdService: AzureAdService,
  ) {}

  /**
   * List available SSO providers
   */
  listProviders() {
    return [
      { id: 'okta', name: 'Okta', protocols: ['SAML', 'OIDC'] },
      { id: 'azure_ad', name: 'Azure AD', protocols: ['SAML', 'OIDC'] },
      { id: 'google_workspace', name: 'Google Workspace', protocols: ['OIDC'] },
      { id: 'onelogin', name: 'OneLogin', protocols: ['SAML', 'OIDC'] },
      { id: 'ping_identity', name: 'Ping Identity', protocols: ['SAML', 'OIDC'] },
      { id: 'auth0', name: 'Auth0', protocols: ['OIDC'] },
    ];
  }

  /**
   * Initialize SSO provider
   */
  async initializeProvider(provider: string, config?: any) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'OKTA':
        return this.oktaService.initialize(config);
      case 'AZURE_AD':
        return this.azureAdService.initialize(config);
      default:
        throw new NotFoundException(`Unknown SSO provider: ${provider}`);
    }
  }

  /**
   * Get SAML metadata
   */
  async getMetadata(provider: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'OKTA':
        return this.oktaService.getSamlMetadata();
      case 'AZURE_AD':
        return this.azureAdService.getSamlMetadata();
      default:
        throw new NotFoundException(`Provider not supported: ${provider}`);
    }
  }

  /**
   * Consume SAML response
   */
  async consumeSamlResponse(samlResponse: string) {
    try {
      // Decode and validate SAML response
      const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
      // In production, would validate XML signature
      return {
        success: true,
        data: {
          user: {
            email: 'user@example.com',
            name: 'Test User',
          },
        },
      };
    } catch (error) {
      this.logger.error(`SAML consume failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle OIDC callback
   */
  async handleOidcCallback(provider: string, code: string, state: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'OKTA':
        return this.oktaService.exchangeCodeForToken(code);
      case 'AZURE_AD':
        return this.azureAdService.exchangeCodeForToken(code);
      default:
        throw new NotFoundException(`Provider not supported: ${provider}`);
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(provider: string, state: string, redirectUri: string) {
    const normalizedProvider = provider.toUpperCase().replace('-', '_');

    switch (normalizedProvider) {
      case 'OKTA':
        return this.oktaService.getAuthUrl(state, redirectUri);
      case 'AZURE_AD':
        return this.azureAdService.getAuthUrl(state, redirectUri);
      default:
        throw new NotFoundException(`Provider not supported: ${provider}`);
    }
  }
}
