import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerCoachingController } from './career-coaching.controller';
import { CareerAdvisorService } from './services/career-advisor.service';
import { SkillGapAnalysisService } from './services/skill-gap-analysis.service';
import { LearningPathService } from './services/learning-path.service';
import { TrajectorySimulationService } from './services/trajectory-simulation.service';
import { InterviewChatbotService } from './services/interview-chatbot.service';
import { MarketTrendService } from './services/market-trend.service';
import { CareerGoalsService } from './services/career-goals.service';
import {
  CareerConversation,
  SkillAssessment,
  LearningPath,
  TrajectorySimulation,
  InterviewPractice,
  MarketTrend,
  CareerGoal,
} from './entities/career-coaching.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CareerConversation,
      SkillAssessment,
      LearningPath,
      TrajectorySimulation,
      InterviewPractice,
      MarketTrend,
      CareerGoal,
    ]),
  ],
  controllers: [CareerCoachingController],
  providers: [
    CareerAdvisorService,
    SkillGapAnalysisService,
    LearningPathService,
    TrajectorySimulationService,
    InterviewChatbotService,
    MarketTrendService,
    CareerGoalsService,
  ],
  exports: [
    CareerAdvisorService,
    SkillGapAnalysisService,
    LearningPathService,
    TrajectorySimulationService,
    InterviewChatbotService,
    MarketTrendService,
    CareerGoalsService,
  ],
})
export class CareerCoachingModule {}
