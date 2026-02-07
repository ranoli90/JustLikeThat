import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { ApplicationModule } from '../application/application.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ApplicationModule, NotificationModule],
  providers: [AutomationService],
  controllers: [AutomationController],
  exports: [AutomationService],
})
export class AutomationModule {}
