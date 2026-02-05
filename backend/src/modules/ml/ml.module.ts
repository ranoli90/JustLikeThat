import { Module } from '@nestjs/common';
import { MLInfrastructureService } from './ml-infrastructure.service';
import { JobMatchingMLService } from './job-matching-ml.service';
import { ResumeOptimizationService } from './resume-optimization.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { NLUProcessingService } from './nlu-processing.service';
import { DocumentVisionService } from './document-vision.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [
    MLInfrastructureService,
    JobMatchingMLService,
    ResumeOptimizationService,
    PredictiveAnalyticsService,
    NLUProcessingService,
    DocumentVisionService,
    PrismaService,
  ],
  exports: [
    MLInfrastructureService,
    JobMatchingMLService,
    ResumeOptimizationService,
    PredictiveAnalyticsService,
    NLUProcessingService,
    DocumentVisionService,
  ],
})
export class MLModule {}
