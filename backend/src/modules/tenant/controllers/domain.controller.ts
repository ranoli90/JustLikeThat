import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DomainService } from '../services/domain.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('api/v1/tenants/:id/domains')
@UseGuards(JwtAuthGuard)
export class DomainController {
  constructor(private readonly domainService: DomainService) {}

  @Get()
  async getDomains(@Param('id') id: string) {
    return this.domainService.getDomains(id);
  }

  @Get(':domainId')
  async getDomain(@Param('domainId') domainId: string) {
    return this.domainService.getDomain(domainId);
  }

  @Get(':domainId/status')
  async getDomainStatus(@Param('domainId') domainId: string) {
    return this.domainService.getDomainStatus(domainId);
  }

  @Get(':domainId/verify')
  async getVerificationDetails(@Param('domainId') domainId: string) {
    return this.domainService.getVerificationDetails(domainId);
  }

  @Get(':domainId/dns')
  async getDNSConfiguration(@Param('domainId') domainId: string) {
    return this.domainService.getDNSConfiguration(domainId);
  }

  @Get(':domainId/health')
  async checkDomainHealth(@Param('domainId') domainId: string) {
    return this.domainService.checkDomainHealth(domainId);
  }

  @Post()
  async addDomain(@Param('id') id: string, @Body() data: { domain: string; subdomain?: string }) {
    return this.domainService.addDomain(id, data.domain, data.subdomain);
  }

  @Post(':domainId/verify')
  async verifyDomain(@Param('domainId') domainId: string) {
    return this.domainService.verifyDomain(domainId);
  }

  @Post(':domainId/ssl')
  async provisionSSL(@Param('domainId') domainId: string) {
    return this.domainService.provisionSSL(domainId);
  }

  @Post(':domainId/cdn')
  async setupCDN(@Param('domainId') domainId: string) {
    return this.domainService.setupCDN(domainId);
  }

  @Put(':domainId')
  async updateDomain(@Param('domainId') domainId: string, @Body() data: any) {
    return this.domainService.updateDomain(domainId, data);
  }

  @Delete(':domainId')
  async removeDomain(@Param('domainId') domainId: string) {
    return this.domainService.removeDomain(domainId);
  }
}
