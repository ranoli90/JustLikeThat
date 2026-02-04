import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobIngestionController } from './job-ingestion.controller';
import { JobIngestionService } from './job-ingestion.service';
import { JobSource } from '../../entities/job-source.entity';
import { IngestionLog } from '../../entities/ingestion-log.entity';
import { JobPosting } from '../../entities/job-posting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobSource, IngestionLog, JobPosting])],
  controllers: [JobIngestionController],
  providers: [JobIngestionService],
  exports: [JobIngestionService],
})
export class JobIngestionModule {}
