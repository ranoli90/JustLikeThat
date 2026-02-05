import { Module, Global } from '@nestjs/common';
import { ComplianceService } from './services/compliance.service';
import { ConsentService } from './services/consent.service';
import { DataResidencyService } from './services/data-residency.service';
import { ComplianceController } from './controllers/compliance.controller';
import { ConsentController } from './controllers/consent.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController, ConsentController],
  providers: [ComplianceService, ConsentService, DataResidencyService],
  exports: [ComplianceService, ConsentService, DataResidencyService],
})
export class ComplianceModule {}
