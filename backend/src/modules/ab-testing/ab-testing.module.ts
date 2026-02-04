import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ABTest } from '../../entities/ab-test.entity';
import { ABTestAssignment } from '../../entities/ab-test.entity';
import { ABTestingController } from './ab-testing.controller';
import { ABTestingService } from './ab-testing.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([ABTest, ABTestAssignment]), UserModule],
  controllers: [ABTestingController],
  providers: [ABTestingService],
  exports: [ABTestingService],
})
export class ABTestingModule {}
