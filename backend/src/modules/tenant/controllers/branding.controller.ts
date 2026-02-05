import { Controller, Get, Put, Post, Body, Param, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BrandingService } from '../services/branding.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('api/v1/tenants/:id/branding')
@UseGuards(JwtAuthGuard)
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  async getBranding(@Param('id') id: string) {
    return this.brandingService.getBranding(id);
  }

  @Get('preview')
  async getBrandingPreview(@Param('id') id: string) {
    return this.brandingService.getBrandingPreview(id);
  }

  @Get('assets')
  async getBrandAssets(@Param('id') id: string) {
    return this.brandingService.getBrandAssets(id);
  }

  @Put()
  async updateBranding(@Param('id') id: string, @Body() updateBrandingDto: any) {
    return this.brandingService.updateBranding(id, updateBrandingDto);
  }

  @Put('colors')
  async updateColorScheme(@Param('id') id: string, @Body() colors: any) {
    return this.brandingService.updateColorScheme(id, colors);
  }

  @Put('typography')
  async updateTypography(@Param('id') id: string, @Body() typography: any) {
    return this.brandingService.updateTypography(id, typography);
  }

  @Put('custom-code')
  async updateCustomCode(@Param('id') id: string, @Body() code: any) {
    return this.brandingService.updateCustomCode(id, code);
  }

  @Put('landing-page')
  async updateLandingPage(@Param('id') id: string, @Body() config: any) {
    return this.brandingService.updateLandingPage(id, config);
  }

  @Put('email-branding')
  async updateEmailBranding(@Param('id') id: string, @Body() emailBranding: any) {
    return this.brandingService.updateEmailBranding(id, emailBranding);
  }

  @Post('assets/logo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: any) {
    return this.brandingService.uploadAsset(id, file, 'logo');
  }

  @Post('assets/favicon')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFavicon(@Param('id') id: string, @UploadedFile() file: any) {
    return this.brandingService.uploadAsset(id, file, 'favicon');
  }

  @Post('assets/hero')
  @UseInterceptors(FileInterceptor('file'))
  async uploadHeroImage(@Param('id') id: string, @UploadedFile() file: any) {
    return this.brandingService.uploadAsset(id, file, 'hero');
  }

  @Post('assets/og')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOgImage(@Param('id') id: string, @UploadedFile() file: any) {
    return this.brandingService.uploadAsset(id, file, 'og');
  }

  @Post('themes/:theme')
  async applyTheme(@Param('id') id: string, @Param('theme') theme: string) {
    return this.brandingService.applyBrandTheme(id, theme);
  }
}
