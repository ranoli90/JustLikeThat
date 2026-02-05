import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface UploadedFile {
  originalname: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

@Injectable()
export class BrandingService {
  constructor(private prisma: PrismaService) {}

  async getBranding(tenantId: string) {
    const branding = await this.prisma.tenantBranding.findUnique({
      where: { tenantId },
    });

    if (!branding) {
      // Return default branding
      return this.createDefaultBranding(tenantId);
    }

    return branding;
  }

  async updateBranding(tenantId: string, updateBrandingDto: any) {
    const branding = await this.prisma.tenantBranding.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...this.getDefaultBrandingData(),
        ...updateBrandingDto,
      },
      update: updateBrandingDto,
    });

    return branding;
  }

  async uploadAsset(tenantId: string, file: UploadedFile, assetType: string) {
    // In production, this would upload to S3/CDN
    const assetUrl = `https://assets.${process.env.DOMAIN || 'example.com'}/${tenantId}/${assetType}/${file.originalname}`;
    
    const updateData: Record<string, string> = {};
    
    switch (assetType) {
      case 'logo':
        updateData.logoUrl = assetUrl;
        break;
      case 'favicon':
        updateData.faviconUrl = assetUrl;
        break;
      case 'hero':
        updateData.heroImageUrl = assetUrl;
        break;
      case 'og':
        updateData.ogImageUrl = assetUrl;
        break;
      default:
        throw new Error(`Unknown asset type: ${assetType}`);
    }

    return this.updateBranding(tenantId, updateData);
  }

  async updateColorScheme(tenantId: string, colors: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  }) {
    return this.updateBranding(tenantId, colors);
  }

  async updateTypography(tenantId: string, typography: {
    primaryFont?: string;
    secondaryFont?: string;
    customFonts?: any;
  }) {
    return this.updateBranding(tenantId, typography);
  }

  async updateCustomCode(tenantId: string, code: {
    customCss?: string;
    customJs?: string;
    headerHtml?: string;
    footerHtml?: string;
  }) {
    return this.updateBranding(tenantId, code);
  }

  async updateLandingPage(tenantId: string, config: any) {
    return this.updateBranding(tenantId, { landingPageConfig: config });
  }

  async updateEmailBranding(tenantId: string, emailBranding: {
    emailHeaderHtml?: string;
    emailFooterHtml?: string;
  }) {
    return this.updateBranding(tenantId, emailBranding);
  }

  async getBrandingPreview(tenantId: string) {
    const branding = await this.getBranding(tenantId);
    
    // Generate CSS variables for preview
    const cssVariables = `
      :root {
        --primary-color: ${branding.primaryColor};
        --secondary-color: ${branding.secondaryColor};
        --accent-color: ${branding.accentColor};
        --background-color: ${branding.backgroundColor};
        --text-color: ${branding.textColor};
        --primary-font: ${branding.primaryFont};
        --secondary-font: ${branding.secondaryFont};
      }
    `;

    return {
      ...branding,
      cssVariables,
      // Include inline styles for key elements
      inlineStyles: {
        button: `background-color: ${branding.primaryColor}; font-family: ${branding.primaryFont};`,
        card: `background-color: ${branding.backgroundColor}; font-family: ${branding.primaryFont};`,
        heading: `color: ${branding.textColor}; font-family: ${branding.primaryFont};`,
      },
    };
  }

  async getDefaultBranding(tenantId: string) {
    return this.createDefaultBranding(tenantId);
  }

  private async createDefaultBranding(tenantId: string) {
    const data = this.getDefaultBrandingData();
    return this.prisma.tenantBranding.create({
      data: { tenantId, ...data },
    });
  }

  private getDefaultBrandingData() {
    return {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      primaryFont: 'Inter',
      secondaryFont: 'Roboto',
      logoUrl: null,
      faviconUrl: null,
      heroImageUrl: null,
      ogImageUrl: null,
      customCss: null,
      customJs: null,
      headerHtml: null,
      footerHtml: null,
      landingPageConfig: null,
      emailHeaderHtml: null,
      emailFooterHtml: null,
      customFonts: null,
    };
  }

  async validateBrandingColors(colors: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
  }): Promise<boolean> {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    
    return (
      colorRegex.test(colors.primaryColor) &&
      colorRegex.test(colors.secondaryColor) &&
      (!colors.accentColor || colorRegex.test(colors.accentColor))
    );
  }

  async getBrandAssets(tenantId: string) {
    const branding = await this.getBranding(tenantId);
    
    return {
      logo: branding.logoUrl,
      favicon: branding.faviconUrl,
      heroImage: branding.heroImageUrl,
      ogImage: branding.ogImageUrl,
      customFonts: branding.customFonts,
    };
  }

  async applyBrandTheme(tenantId: string, theme: string) {
    const themes: Record<string, any> = {
      default: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
      },
      corporate: {
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        accentColor: '#60A5FA',
      },
      modern: {
        primaryColor: '#7C3AED',
        secondaryColor: '#A855F7',
        accentColor: '#EC4899',
      },
      nature: {
        primaryColor: '#059669',
        secondaryColor: '#10B981',
        accentColor: '#84CC16',
      },
      dark: {
        primaryColor: '#111827',
        secondaryColor: '#374151',
        accentColor: '#6B7280',
        backgroundColor: '#1F2937',
        textColor: '#F9FAFB',
      },
    };

    if (!themes[theme]) {
      throw new Error(`Unknown theme: ${theme}`);
    }

    return this.updateBranding(tenantId, themes[theme]);
  }
}
