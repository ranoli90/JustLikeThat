import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { LLMFineTuningService } from './llm-fine-tuning.service';
import { RLMatchingService } from './rl-matching.service';
import { TransferLearningService } from './transfer-learning.service';
import { ModelVersioningService } from './model-versioning.service';
import { AutoRetrainingService } from './auto-retraining.service';
import { ModelExplainabilityService } from './model-explainability.service';

// DTOs
interface CreateModelDto {
  name: string;
  type: string;
  baseModel: string;
  hyperparameters?: Record<string, any>;
}

interface FineTuningRequestDto {
  modelId: string;
  trainingDataPath: string;
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
}

interface CreateABTestDto {
  name: string;
  modelAId: string;
  modelBId: string;
  trafficSplit: { modelA: number; modelB: number };
}

interface ExplainRequestDto {
  modelId: string;
  predictionId: string;
  explanationType: 'shap' | 'lime' | 'attention';
}

@Controller('api/v1/ml-training')
export class MlTrainingController {
  constructor(
    private readonly llmFineTuningService: LLMFineTuningService,
    private readonly rlMatchingService: RLMatchingService,
    private readonly transferLearningService: TransferLearningService,
    private readonly modelVersioningService: ModelVersioningService,
    private readonly autoRetrainingService: AutoRetrainingService,
    private readonly modelExplainabilityService: ModelExplainabilityService,
  ) {}

  // ============ MODEL MANAGEMENT ============

  @Get('models')
  async getModels(@Query('type') type?: string) {
    try {
      return await this.modelVersioningService.getModels(type);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch models', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('models')
  async createModel(@Body() createModelDto: CreateModelDto) {
    try {
      return await this.modelVersioningService.createModel(createModelDto);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create model', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('models/:id')
  async getModel(@Param('id') id: string) {
    try {
      const model = await this.modelVersioningService.getModelById(id);
      if (!model) {
        throw new HttpException({ message: 'Model not found' }, HttpStatus.NOT_FOUND);
      }
      return model;
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch model', error: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('models/:id')
  async updateModel(@Param('id') id: string, @Body() updateData: Partial<CreateModelDto>) {
    try {
      return await this.modelVersioningService.updateModel(id, updateData);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to update model', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('models/:id')
  async deleteModel(@Param('id') id: string) {
    try {
      await this.modelVersioningService.deleteModel(id);
      return { message: 'Model deleted successfully' };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to delete model', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('models/:id/train')
  async triggerTraining(@Param('id') id: string, @Body() config: any) {
    try {
      return await this.llmFineTuningService.startTraining(id, config);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to trigger training', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ FINE-TUNING ============

  @Post('fine-tune')
  async startFineTuning(@Body() request: FineTuningRequestDto) {
    try {
      return await this.llmFineTuningService.startFineTuning(request);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to start fine-tuning', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('fine-tune/:id')
  async getFineTuningStatus(@Param('id') id: string) {
    try {
      return await this.llmFineTuningService.getTrainingStatus(id);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to get fine-tuning status', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('fine-tune/:id/progress')
  async getFineTuningProgress(@Param('id') id: string) {
    try {
      return await this.llmFineTuningService.getTrainingProgress(id);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to get fine-tuning progress', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ A/B TESTING ============

  @Get('ab-tests')
  async getABTests() {
    try {
      return await this.modelVersioningService.getABTests();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch A/B tests', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ab-tests')
  async createABTest(@Body() createABTestDto: CreateABTestDto) {
    try {
      return await this.modelVersioningService.createABTest(createABTestDto);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create A/B test', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('ab-tests/:id')
  async getABTest(@Param('id') id: string) {
    try {
      return await this.modelVersioningService.getABTestById(id);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch A/B test', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('ab-tests/:id/stop')
  async stopABTest(@Param('id') id: string) {
    try {
      return await this.modelVersioningService.stopABTest(id);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to stop A/B test', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ RETRAINING ============

  @Get('retraining/jobs')
  async getRetrainingJobs() {
    try {
      return await this.autoRetrainingService.getRetrainingJobs();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch retraining jobs', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('retraining/trigger')
  async triggerRetraining(@Body() config: { modelId: string; reason?: string }) {
    try {
      return await this.autoRetrainingService.triggerRetraining(config.modelId, config.reason);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to trigger retraining', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('retraining/drift')
  async getDriftDetections(@Query('modelId') modelId?: string) {
    try {
      return await this.autoRetrainingService.getDriftDetections(modelId);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch drift detections', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ EXPLAINABILITY ============

  @Post('explain')
  async generateExplanation(@Body() request: ExplainRequestDto) {
    try {
      return await this.modelExplainabilityService.generateExplanation(
        request.modelId,
        request.predictionId,
        request.explanationType,
      );
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to generate explanation', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('explain/:predictionId')
  async getExplanation(@Param('predictionId') predictionId: string) {
    try {
      return await this.modelExplainabilityService.getExplanation(predictionId);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch explanation', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ MODEL REGISTRY ============

  @Get('registry/models')
  async getRegisteredModels() {
    try {
      return await this.modelVersioningService.getRegisteredModels();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch registered models', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('registry/deploy')
  async deployModel(@Body() config: { modelId: string; version: string }) {
    try {
      return await this.modelVersioningService.deployModel(config.modelId, config.version);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to deploy model', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('registry/rollback')
  async rollbackModel(@Body() config: { modelId: string; targetVersion: string }) {
    try {
      return await this.modelVersioningService.rollbackModel(config.modelId, config.targetVersion);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to rollback model', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ TRANSFER LEARNING ============

  @Post('transfer/adapt')
  async adaptModel(@Body() config: { modelId: string; targetDomain: string }) {
    try {
      return await this.transferLearningService.adaptModel(config.modelId, config.targetDomain);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to adapt model', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transfer/domains')
  async getAvailableDomains() {
    try {
      return await this.transferLearningService.getAvailableDomains();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch available domains', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============ RL MATCHING ============

  @Post('rl/update-rewards')
  async updateRewards(@Body() data: { matchId: string; reward: number }) {
    try {
      return await this.rlMatchingService.updateReward(data.matchId, data.reward);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to update rewards', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('rl/policy-status')
  async getPolicyStatus() {
    try {
      return await this.rlMatchingService.getPolicyStatus();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch policy status', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
