import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { CandidateProfile } from '../../entities/candidate-profile.entity';
import { Resume } from '../../entities/resume.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateProfile, Resume])],
  providers: [ProfileService],
  controllers: [ProfileController],
  exports: [ProfileService],
})
export class ProfileModule {}
