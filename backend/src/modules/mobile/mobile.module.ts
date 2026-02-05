/**
 * Mobile Module - Backend API for mobile applications
 * Sprint 46: Mobile Application Development
 */

import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { MobileAuthController } from './controllers/mobile-auth.controller';
import { MobileDevicesController } from './controllers/mobile-devices.controller';
import { MobilePushController } from './controllers/mobile-push.controller';
import { MobileWidgetsController } from './controllers/mobile-widgets.controller';
import { MobileSyncController } from './controllers/mobile-sync.controller';
import { MobileAnalyticsController } from './controllers/mobile-analytics.controller';
import { PrismaService } from '../prisma/prisma.service';

const logger = new Logger('MobileModule');

/**
 * Validate that JWT_SECRET is set before module initialization
 */
function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = 'JWT_SECRET environment variable is required for MobileModule';
    logger.error(error);
    throw new Error(error);
  }
  if (secret.length < 32) {
    const warning = 'JWT_SECRET should be at least 32 characters for HS256';
    logger.warn(warning);
  }
  return secret;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = validateJwtSecret();
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [
    MobileController,
    MobileAuthController,
    MobileDevicesController,
    MobilePushController,
    MobileWidgetsController,
    MobileSyncController,
    MobileAnalyticsController,
  ],
  providers: [MobileService, PrismaService],
  exports: [MobileService],
})
export class MobileModule {}
