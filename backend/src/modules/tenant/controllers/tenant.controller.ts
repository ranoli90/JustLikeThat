import { 
  Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, 
  UseGuards, Request, HttpCode, HttpStatus 
} from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto, UpdateTenantStatusDto, UpdateTenantPlanDto } from '../services/dto/tenant.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';

@Controller('api/v1/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  async create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  async findAll(@Query() query: TenantQueryDto) {
    return this.tenantService.findAll(query);
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getAllStats(@Query('id') id: string) {
    return this.tenantService.getTenantStats(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.tenantService.findBySlug(slug);
  }

  @Get('domain/:domain')
  async findByDomain(@Param('domain') domain: string) {
    return this.tenantService.findByDomain(domain);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Get(':id/stats')
  async getTenantStats(@Param('id') id: string) {
    return this.tenantService.getTenantStats(id);
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateTenantStatusDto) {
    return this.tenantService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id/plan')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePlan(@Param('id') id: string, @Body() updatePlanDto: UpdateTenantPlanDto) {
    return this.tenantService.updatePlan(id, updatePlanDto.plan);
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.tenantService.delete(id);
  }

  @Delete(':id/hard')
  @Roles('SUPER_ADMIN')
  async hardDelete(@Param('id') id: string) {
    return this.tenantService.hardDelete(id);
  }

  @Post('generate-slug')
  async generateSlug(@Body('name') name: string) {
    const slug = await this.tenantService.generateSlug(name);
    return { slug };
  }
}
