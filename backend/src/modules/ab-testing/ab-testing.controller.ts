import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ABTestingService } from './ab-testing.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/ab-testing')
export class ABTestingController {
  constructor(private readonly abTestingService: ABTestingService) {}

  @Post('tests')
  @UseGuards(JwtAuthGuard)
  async createTest(
    @Body() body: { name: string; description: string; variants: any[] },
  ) {
    const test = await this.abTestingService.createTest(
      body.name,
      body.description,
      body.variants,
    );
    return { success: true, data: test };
  }

  @Get('tests')
  @UseGuards(JwtAuthGuard)
  async getAllTests() {
    const tests = await this.abTestingService.getAllTests();
    return { success: true, data: tests };
  }

  @Get('tests/:id')
  @UseGuards(JwtAuthGuard)
  async getTest(@Param('id') id: string) {
    const test = await this.abTestingService.getTest(id);
    return { success: true, data: test };
  }

  @Patch('tests/:id/start')
  @UseGuards(JwtAuthGuard)
  async startTest(@Param('id') id: string) {
    const test = await this.abTestingService.startTest(id);
    return { success: true, data: test };
  }

  @Patch('tests/:id/pause')
  @UseGuards(JwtAuthGuard)
  async pauseTest(@Param('id') id: string) {
    const test = await this.abTestingService.pauseTest(id);
    return { success: true, data: test };
  }

  @Patch('tests/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeTest(@Param('id') id: string) {
    const test = await this.abTestingService.completeTest(id);
    return { success: true, data: test };
  }

  @Post('assign/:testName')
  @UseGuards(JwtAuthGuard)
  async assignVariant(@Request() req, @Param('testName') testName: string) {
    try {
      const assignment = await this.abTestingService.assignVariant(req.user, testName);
      return { success: true, data: assignment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Get('variant/:testName')
  @UseGuards(JwtAuthGuard)
  async getUserVariant(@Request() req, @Param('testName') testName: string) {
    const variant = await this.abTestingService.getUserVariant(req.user, testName);
    return { success: true, data: variant };
  }

  @Post('conversion/:assignmentId')
  @UseGuards(JwtAuthGuard)
  async recordConversion(
    @Param('assignmentId') assignmentId: string,
    @Body() body: { conversionType: string; value?: any },
  ) {
    const assignment = await this.abTestingService.recordConversion(assignmentId, body);
    return { success: true, data: assignment };
  }
}
