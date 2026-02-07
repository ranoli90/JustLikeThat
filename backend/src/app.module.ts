import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ResumeModule } from './modules/resume/resume.module';
import { JobIngestionModule } from './modules/job-ingestion/job-ingestion.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ApplicationModule } from './modules/application/application.module';
import { AutomationModule } from './modules/automation/automation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { IntakeModule } from './modules/intake/intake.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UserModule,
    ProfileModule,
    ResumeModule,
    JobIngestionModule,
    MatchingModule,
    ApplicationModule,
    AutomationModule,
    NotificationModule,
    IntakeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
