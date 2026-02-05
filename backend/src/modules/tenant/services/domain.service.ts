import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DomainService {
  constructor(private prisma: PrismaService) {}

  async getDomains(tenantId: string) {
    return this.prisma.customDomain.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDomain(domainId: string) {
    const domain = await this.prisma.customDomain.findUnique({
      where: { id: domainId },
    });
    if (!domain) throw new NotFoundException('Domain not found');
    return domain;
  }

  async addDomain(tenantId: string, domain: string, subdomain?: string) {
    // Check if domain already exists
    const existing = await this.prisma.customDomain.findFirst({
      where: { domain },
    });
    if (existing) {
      throw new ConflictException('Domain already in use');
    }

    const verificationToken = uuidv4();

    return this.prisma.customDomain.create({
      data: {
        tenantId,
        domain,
        subdomain,
        verificationToken,
        status: 'PENDING',
        sslStatus: 'PENDING',
      },
    });
  }

  async verifyDomain(domainId: string) {
    const domain = await this.getDomain(domainId);
    
    // In production, this would verify DNS records
    return this.prisma.customDomain.update({
      where: { id: domainId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        status: 'VERIFIED',
      },
    });
  }

  async updateDomain(domainId: string, data: any) {
    await this.getDomain(domainId);
    return this.prisma.customDomain.update({
      where: { id: domainId },
      data,
    });
  }

  async removeDomain(domainId: string) {
    await this.getDomain(domainId);
    return this.prisma.customDomain.delete({
      where: { id: domainId },
    });
  }

  async provisionSSL(domainId: string) {
    const domain = await this.getDomain(domainId);
    
    // In production, this would call Let's Encrypt or similar
    // For now, simulate SSL provisioning
    const sslExpiresAt = new Date();
    sslExpiresAt.setFullYear(sslExpiresAt.getFullYear() + 1);

    return this.prisma.customDomain.update({
      where: { id: domainId },
      data: {
        sslStatus: 'ACTIVE',
        sslCertUrl: `https://certs.${process.env.DOMAIN || 'example.com'}/${domain.domain}/cert.pem`,
        sslExpiresAt,
        status: 'ACTIVE',
      },
    });
  }

  async getDomainStatus(domainId: string) {
    const domain = await this.getDomain(domainId);
    
    return {
      id: domain.id,
      domain: domain.domain,
      status: domain.status,
      sslStatus: domain.sslStatus,
      isVerified: domain.isVerified,
      dnsConfig: domain.dnsConfig,
      cdnEnabled: domain.cdnEnabled,
    };
  }

  async getVerificationDetails(domainId: string) {
    const domain = await this.getDomain(domainId);
    
    return {
      domain: domain.domain,
      verificationToken: domain.verificationToken,
      recordType: 'TXT',
      name: `_verify.${domain.domain}`,
      value: domain.verificationToken,
      recommendedTTL: 3600,
      instructions: `Add a TXT record with name "_verify.${domain.domain}" and value "${domain.verificationToken}"`,
    };
  }

  async getDNSConfiguration(domainId: string) {
    const domain = await this.getDomain(domainId);
    
    return {
      domain: domain.domain,
      records: [
        {
          type: 'A',
          name: domain.domain,
          value: process.env.DOMAIN_IP || '192.0.2.1',
          ttl: 3600,
        },
        {
          type: 'CNAME',
          name: `www.${domain.domain}`,
          value: domain.domain,
          ttl: 3600,
        },
      ],
    };
  }

  async setupCDN(domainId: string) {
    await this.getDomain(domainId);
    
    // In production, this would set up CDN (Cloudflare, AWS CloudFront, etc.)
    return this.prisma.customDomain.update({
      where: { id: domainId },
      data: {
        cdnEnabled: true,
      },
    });
  }

  async checkDomainHealth(domainId: string) {
    const domain = await this.getDomain(domainId);
    
    const checks = {
      dnsPropagation: domain.isVerified,
      sslInstalled: domain.sslStatus === 'ACTIVE',
      cdnEnabled: domain.cdnEnabled,
      status: domain.status === 'ACTIVE',
    };

    const allHealthy = Object.values(checks).every(v => v);
    
    return {
      domain: domain.domain,
      isHealthy: allHealthy,
      checks,
      lastChecked: new Date(),
    };
  }
}
