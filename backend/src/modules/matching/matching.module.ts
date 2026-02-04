import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { EmbeddingService } from './embedding.service';
import { CulturalFitService } from './cultural-fit.service';
import { CareerTrajectoryService } from './career-trajectory.service';
import { LearningToRankService } from './learning-to-rank.service';
import { RecommendationService } from './recommendation.service';
import { MatchQualityService } from './match-quality.service';
import { PreferenceModelingService } from './preference-modeling.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona, JobPosting, UserPreferences]),
  ],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    EmbeddingService,
    CulturalFitService,
    CareerTrajectoryService,
    LearningToRankService,
    RecommendationService,
    MatchQualityService,
    PreferenceModelingService,
  ],
  exports: [
    MatchingService,
    EmbeddingService,
    CulturalFitService,
    CareerTrajectoryService,
    LearningToRankService,
    RecommendationService,
    MatchQualityService,
    PreferenceModelingService,
  ],
})
export class MatchingModule {}
