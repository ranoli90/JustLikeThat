import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiRegionService } from './services/multi-region.service';
import { EdgeComputingService } from './services/edge-computing.service';
import { CDNOptimizationService } from './services/cdn-optimization.service';
import { DataResidencyService } from './services/data-residency.service';
import { GeoDatabaseService } from './services/geo-database.service';
import { DisasterRecoveryService } from './services/disaster-recovery.service';
import { GlobalInfrastructureController } from './controllers/global-infrastructure.controller';

@Module({
  imports: [forwardRef(() => PrismaModule)],
  controllers: [GlobalInfrastructureController],
  providers: [
    MultiRegionService,
    EdgeComputingService,
    CDNOptimizationService,
    DataResidencyService,
    GeoDatabaseService,
    DisasterRecoveryService,
  ],
  exports: [
    MultiRegionService,
    EdgeComputingService,
    CDNOptimizationService,
    DataResidencyService,
    GeoDatabaseService,
    DisasterRecoveryService,
  ],
})
export class GlobalInfrastructureModule {}
