import { Module } from '@nestjs/common';
import { JobIngestionService } from './job-ingestion.service';
import { JobIngestionController } from './job-ingestion.controller';

@Module({
  providers: [JobIngestionService],
  controllers: [JobIngestionController],
  exports: [JobIngestionService],
})
export class JobIngestionModule {}
