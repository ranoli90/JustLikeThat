import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { Metric } from './entities/metric.entity';
import { Alert } from './entities/alert.entity';
import { CostControl } from './entities/cost-control.entity';
import { LogEntry } from './entities/log-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Metric, Alert, CostControl, LogEntry])],
  providers: [MonitoringService],
  controllers: [MonitoringController],
  exports: [MonitoringService],
})
export class MonitoringModule {}
