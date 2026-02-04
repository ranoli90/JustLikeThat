import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TailoringService } from './tailoring.service';
import { TailoringController } from './tailoring.controller';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Persona, JobPosting])],
  providers: [TailoringService],
  controllers: [TailoringController],
  exports: [TailoringService],
})
export class TailoringModule {}
