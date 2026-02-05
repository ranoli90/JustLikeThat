import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FeatureFlagService } from '../services/feature-flag.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('api/v1/tenants/:id/features')
@UseGuards(JwtAuthGuard)
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get()
  async getFeatures(@Param('id') id: string) {
    return this.featureFlagService.getFeatures(id);
  }

  @Get('enabled')
  async getEnabledFeatures(@Param('id') id: string) {
    return this.featureFlagService.getEnabledFeatures(id);
  }

  @Get('disabled')
  async getDisabledFeatures(@Param('id') id: string) {
    return this.featureFlagService.getDisabledFeatures(id);
  }

  @Get(':featureKey')
  async getFeature(@Param('id') id: string, @Param('featureKey') featureKey: string) {
    return this.featureFlagService.getFeature(id, featureKey);
  }

  @Get(':featureKey/check')
  async isEnabled(@Param('id') id: string, @Param('featureKey') featureKey: string) {
    const isEnabled = await this.featureFlagService.isEnabled(id, featureKey);
    return { featureKey, isEnabled };
  }

  @Put(':featureKey')
  async updateFeature(
    @Param('id') id: string,
    @Param('featureKey') featureKey: string,
    @Body() data: { isEnabled?: boolean; config?: any; priority?: number }
  ) {
    return this.featureFlagService.updateFeature(id, featureKey, data);
  }

  @Delete(':featureKey')
  async deleteFeature(@Param('id') id: string, @Param('featureKey') featureKey: string) {
    return this.featureFlagService.deleteFeature(id, featureKey);
  }

  @Post(':featureKey/toggle')
  async toggleFeature(@Param('id') id: string, @Param('featureKey') featureKey: string) {
    return this.featureFlagService.toggleFeature(id, featureKey);
  }

  @Post('bulk')
  async bulkUpdate(@Param('id') id: string, @Body() features: Array<{ featureKey: string; isEnabled: boolean; config?: any }>) {
    return this.featureFlagService.bulkUpdate(id, features);
  }

  @Post('initialize')
  async initializeDefaults(@Param('id') id: string) {
    return this.featureFlagService.initializeDefaultFeatures(id);
  }
}
