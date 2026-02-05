import { Module, Global } from '@nestjs/common';
import { RegionalJobService } from './services/regional-job.service';
import { JobSourceService } from './services/job-source.service';
import { SalaryDataService } from './services/salary-data.service';
import { RegionalController } from './controllers/regional.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [RegionalController],
  providers: [RegionalJobService, JobSourceService, SalaryDataService],
  exports: [RegionalJobService, JobSourceService, SalaryDataService],
})
export class RegionalModule {}
