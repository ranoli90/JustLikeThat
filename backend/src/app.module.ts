import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProfileModule } from './modules/profile/profile.module';
import { JobIngestionModule } from './modules/job-ingestion/job-ingestion.module';
import { ApplicationModule } from './modules/application/application.module';
import { AutomationModule } from './modules/automation/automation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { IntakeModule } from './modules/intake/intake.module';
import { MatchingModule } from './modules/matching/matching.module';
import { TailoringModule } from './modules/tailoring/tailoring.module';
import { OrchestratorModule } from './modules/orchestrator/orchestrator.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { User } from './entities/user.entity';
import { CandidateProfile } from './entities/candidate-profile.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { Resume } from './entities/resume.entity';
import { Persona } from './entities/persona.entity';
import { JobPosting } from './entities/job-posting.entity';
import { Application } from './entities/application.entity';
import { JobSource } from './entities/job-source.entity';
import { IngestionLog } from './entities/ingestion-log.entity';
import { OrchestratorTask } from './modules/orchestrator/entities/orchestrator-task.entity';
import { Metric } from './modules/monitoring/entities/metric.entity';
import { Alert } from './modules/monitoring/entities/alert.entity';
import { CostControl } from './modules/monitoring/entities/cost-control.entity';
import { LogEntry } from './modules/monitoring/entities/log-entry.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User,
          CandidateProfile,
          UserPreferences,
          Resume,
          Persona,
          JobPosting,
          Application,
          JobSource,
          IngestionLog,
          OrchestratorTask,
          Metric,
          Alert,
          CostControl,
          LogEntry,
        ],
        synchronize: true, // Set to false in production
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ProfileModule,
    JobIngestionModule,
    ApplicationModule,
    AutomationModule,
    NotificationModule,
    IntakeModule,
    MatchingModule,
    TailoringModule,
    OrchestratorModule,
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
