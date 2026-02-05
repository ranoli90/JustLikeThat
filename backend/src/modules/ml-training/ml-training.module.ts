import { Module } from '@nestjs/common';
import { MlTrainingController } from './ml-training.controller';
import { LLMFineTuningService } from './llm-fine-tuning.service';
import { RLMatchingService } from './rl-matching.service';
import { TransferLearningService } from './transfer-learning.service';
import { ModelVersioningService } from './model-versioning.service';
import { AutoRetrainingService } from './auto-retraining.service';
import { ModelExplainabilityService } from './model-explainability.service';
import { PrismaModule } from '../integrations/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MlTrainingController],
  providers: [
    LLMFineTuningService,
    RLMatchingService,
    TransferLearningService,
    ModelVersioningService,
    AutoRetrainingService,
    ModelExplainabilityService,
  ],
  exports: [
    LLMFineTuningService,
    RLMatchingService,
    TransferLearningService,
    ModelVersioningService,
    AutoRetrainingService,
    ModelExplainabilityService,
  ],
})
export class MlTrainingModule {}
