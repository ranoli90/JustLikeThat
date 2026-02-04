import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { TailoringService } from './tailoring.service';
import { CreateTailoringRequest, createTailoringRequestSchema } from './dto/create-tailoring-request.zod';
import { TailoredDocumentResponse } from './dto/tailored-document-response.zod';
import { ZodValidationPipe } from '../../pipes/zod.pipe';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('tailoring')
@UseGuards(JwtAuthGuard)
export class TailoringController {
  constructor(private readonly tailoringService: TailoringService) {}

  /**
   * Tailors a document (resume or cover letter) for a specific job posting
   */
  @Post('tailor')
  async tailorDocument(
    @Body(new ZodValidationPipe(createTailoringRequestSchema)) request: CreateTailoringRequest,
  ): Promise<TailoredDocumentResponse> {
    return this.tailoringService.tailorDocument(request);
  }

  /**
   * Returns validation examples of raw vs tailored content
   */
  @Get('validation-examples')
  async getValidationExamples() {
    return this.tailoringService.getValidationExamples();
  }

  /**
   * Returns prevention and cost plans
   */
  @Get('prevention-cost-plans')
  async getPreventionCostPlans() {
    return this.tailoringService.getPreventionCostPlans();
  }

  /**
   * Returns assumptions for human review
   */
  @Get('assumptions')
  async getAssumptions() {
    return this.tailoringService.getAssumptions();
  }
}
