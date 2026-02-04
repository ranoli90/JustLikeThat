import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerService } from './career.service';
import { CareerController } from './career.controller';
import { CareerPath } from '../../entities/career-path.entity';
import { SkillGap } from '../../entities/skill-gap.entity';
import { CareerMilestone, MilestoneTemplate } from '../../entities/career-milestone.entity';
import { CareerGoal } from '../../entities/career-goal.entity';
import { Certification, CertificationTemplate } from '../../entities/certification.entity';
import { LearningResource, LearningResourceTemplate } from '../../entities/learning-resource.entity';
import { MentorshipRelationship, MentorProfile } from '../../entities/mentorship.entity';
import { SalaryProjection, SalaryHistory } from '../../entities/salary-projection.entity';
import { IndustryTrend, SkillPrediction } from '../../entities/industry-trend.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CareerPath,
      SkillGap,
      CareerMilestone,
      MilestoneTemplate,
      CareerGoal,
      Certification,
      CertificationTemplate,
      LearningResource,
      LearningResourceTemplate,
      MentorshipRelationship,
      MentorProfile,
      SalaryProjection,
      SalaryHistory,
      IndustryTrend,
      SkillPrediction,
    ]),
  ],
  controllers: [CareerController],
  providers: [CareerService],
  exports: [CareerService],
})
export class CareerModule {}
