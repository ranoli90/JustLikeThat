import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [TypeOrmModule.forFeature([Persona, JobPosting, UserPreferences])],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
