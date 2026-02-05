import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { JobMatchingMLService } from './job-matching-ml.service';
import { ResumeOptimizationService } from './resume-optimization.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { NLUProcessingService } from './nlu-processing.service';
import { DocumentVisionService } from './document-vision.service';

/**
 * Job Matching Controller
 * API endpoints for candidate-job matching with ML
 */
@Controller('api/v1/ml/job-matching')
export class JobMatchingController {
  constructor(private readonly jobMatchingService: JobMatchingMLService) {}

  @Post('predict')
  @HttpCode(HttpStatus.OK)
  async matchCandidateToJob(
    @Body() body: {
      candidateId: string;
      jobId: string;
      candidateProfile: any;
      preferences?: any;
    },
  ) {
    return this.jobMatchingService.matchCandidateToJob(
      {
        candidateId: body.candidateId,
        candidateProfile: body.candidateProfile,
        preferences: body.preferences,
      },
      body.jobId,
    );
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async batchMatch(
    @Body() body: {
      candidateId: string;
      candidateProfile: any;
      jobIds: string[];
      preferences?: any;
    },
  ) {
    return this.jobMatchingService.batchMatchCandidateToJobs(
      {
        candidateId: body.candidateId,
        candidateProfile: body.candidateProfile,
        preferences: body.preferences,
      },
      body.jobIds,
    );
  }

  @Get('explanation/:id')
  async getMatchExplanation(@Param('id') predictionId: string) {
    return this.jobMatchingService.getMatchExplanation(predictionId);
  }
}

/**
 * Resume Optimization Controller
 * API endpoints for resume analysis and optimization
 */
@Controller('api/v1/ml/resume-optimization')
export class ResumeOptimizationController {
  constructor(private readonly resumeOptimizationService: ResumeOptimizationService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeResume(
    @Body() body: {
      resumeText: string;
      targetJobId?: string;
    },
  ) {
    return this.resumeOptimizationService.analyzeResume(
      body.resumeText,
      body.targetJobId,
    );
  }

  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  async optimizeResume(
    @Body() body: {
      resumeText: string;
      resumeId?: string;
      targetJobId?: string;
      targetJobDescription?: string;
      targetRole?: string;
    },
  ) {
    return this.resumeOptimizationService.optimizeResume(body.resumeText, {
      resumeId: body.resumeId || '',
      targetJobId: body.targetJobId,
      targetJobDescription: body.targetJobDescription,
      targetRole: body.targetRole,
    });
  }

  @Get('history/:resumeId')
  async getOptimizationHistory(@Param('resumeId') resumeId: string) {
    return this.resumeOptimizationService.getOptimizationHistory(resumeId);
  }
}

/**
 * Predictive Analytics Controller
 * API endpoints for application success prediction and hiring analytics
 */
@Controller('api/v1/ml/predict')
export class PredictiveAnalyticsController {
  constructor(private readonly predictiveAnalyticsService: PredictiveAnalyticsService) {}

  @Post('application-success')
  @HttpCode(HttpStatus.OK)
  async predictApplicationSuccess(
    @Body() body: {
      candidateId: string;
      jobId: string;
      applicationData?: any;
    },
  ) {
    return this.predictiveAnalyticsService.predictApplicationSuccess({
      candidateId: body.candidateId,
      jobId: body.jobId,
      applicationData: body.applicationData,
    });
  }

  @Post('time-to-hire')
  @HttpCode(HttpStatus.OK)
  async estimateTimeToHire(
    @Body() body: {
      jobId: string;
      candidateId: string;
      marketConditions?: any;
    },
  ) {
    return this.predictiveAnalyticsService.estimateTimeToHire({
      jobId: body.jobId,
      candidateId: body.candidateId,
      marketConditions: body.marketConditions,
    });
  }

  @Post('career-trajectory')
  @HttpCode(HttpStatus.OK)
  async predictCareerTrajectory(
    @Body() body: {
      candidateId: string;
      currentRole: string;
      currentIndustry: string;
      yearsOfExperience: number;
      skills: string[];
      educationLevel: string;
      goals?: string[];
    },
  ) {
    return this.predictiveAnalyticsService.predictCareerTrajectory({
      candidateId: body.candidateId,
      currentRole: body.currentRole,
      currentIndustry: body.currentIndustry,
      yearsOfExperience: body.yearsOfExperience,
      skills: body.skills,
      educationLevel: body.educationLevel,
      goals: body.goals,
    });
  }

  @Get('hiring-trends')
  async analyzeHiringTrends(
    @Query('industry') industry?: string,
    @Query('timeframe') timeframeMonths?: number,
  ) {
    return this.predictiveAnalyticsService.analyzeHiringTrends(
      industry,
      timeframeMonths || 6,
    );
  }
}

/**
 * NLU Processing Controller
 * API endpoints for semantic understanding and NLP
 */
@Controller('api/v1/nlu')
export class NLUController {
  constructor(private readonly nluService: NLUProcessingService) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeText(@Body() body: { text: string; language?: string }) {
    return this.nluService.analyze({
      text: body.text,
      language: body.language,
    });
  }

  @Post('extract-skills')
  @HttpCode(HttpStatus.OK)
  async extractSkills(@Body() body: { text: string }) {
    return this.nluService.extractSkills(body.text);
  }

  @Post('semantic-similarity')
  @HttpCode(HttpStatus.OK)
  async calculateSemanticSimilarity(
    @Body() body: { text1: string; text2: string },
  ) {
    const similarity = await this.nluService.calculateSemanticSimilarity(
      body.text1,
      body.text2,
    );
    return { similarity };
  }

  @Post('parse-job-description')
  @HttpCode(HttpStatus.OK)
  async parseJobDescription(@Body() body: { jobDescription: string }) {
    return this.nluService.parseJobDescription(body.jobDescription);
  }
}

/**
 * Document Vision Controller
 * API endpoints for document analysis and computer vision
 */
@Controller('api/v1/vision')
export class DocumentVisionController {
  constructor(private readonly documentVisionService: DocumentVisionService) {}

  @Post('analyze-layout')
  @HttpCode(HttpStatus.OK)
  async analyzeLayout(
    @Body() body: {
      documentId: string;
      documentType: string;
      documentUrl?: string;
      mimeType?: string;
    },
  ) {
    return this.documentVisionService.analyzeLayout({
      documentId: body.documentId,
      documentType: body.documentType as any,
      documentUrl: body.documentUrl,
      mimeType: body.mimeType,
    });
  }

  @Post('detect-signature')
  @HttpCode(HttpStatus.OK)
  async detectSignature(
    @Body() body: {
      documentId: string;
      documentType: string;
      documentUrl?: string;
    },
  ) {
    return this.documentVisionService.detectSignature({
      documentId: body.documentId,
      documentType: body.documentType as any,
      documentUrl: body.documentUrl,
    });
  }

  @Post('assess-quality')
  @HttpCode(HttpStatus.OK)
  async assessQuality(
    @Body() body: {
      documentId: string;
      documentType: string;
      documentUrl?: string;
    },
  ) {
    return this.documentVisionService.assessPhotoQuality({
      documentId: body.documentId,
      documentType: body.documentType as any,
      documentUrl: body.documentUrl,
    });
  }

  @Post('detect-authenticity')
  @HttpCode(HttpStatus.OK)
  async detectAuthenticity(
    @Body() body: {
      documentId: string;
      documentType: string;
      documentUrl?: string;
    },
  ) {
    return this.documentVisionService.detectAuthenticity({
      documentId: body.documentId,
      documentType: body.documentType as any,
      documentUrl: body.documentUrl,
    });
  }

  @Post('categorize')
  @HttpCode(HttpStatus.OK)
  async categorizeDocument(
    @Body() body: {
      documentId: string;
      documentType: string;
      documentUrl?: string;
    },
  ) {
    return this.documentVisionService.categorizeDocument({
      documentId: body.documentId,
      documentType: body.documentType as any,
      documentUrl: body.documentUrl,
    });
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeAnalysis(
    @Body() body: {
      documentId: string;
      documentType: string;
      documentUrl?: string;
    },
  ) {
    return this.documentVisionService.analyzeDocument({
      documentId: body.documentId,
      documentType: body.documentType as any,
      documentUrl: body.documentUrl,
    });
  }
}
