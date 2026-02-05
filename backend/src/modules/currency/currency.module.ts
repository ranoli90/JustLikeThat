import { Module, Global } from '@nestjs/common';
import { CurrencyService } from './services/currency.service';
import { PricingService } from './services/pricing.service';
import { TaxService } from './services/tax.service';
import { CurrencyController } from './controllers/currency.controller';
import { PricingController } from './controllers/pricing.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [CurrencyController, PricingController],
  providers: [CurrencyService, PricingService, TaxService],
  exports: [CurrencyService, PricingService, TaxService],
})
export class CurrencyModule {}
