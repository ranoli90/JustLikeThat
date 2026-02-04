import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { Application } from '../../entities/application.entity';
import { ApplicationStateMachine } from './application.state-machine';
import { ApplicationPreventionService } from './application-prevention.service';

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationStateMachine, ApplicationPreventionService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
