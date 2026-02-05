import { Module, Global } from '@nestjs/common';
import { ConsulService } from './services/consul.service';
import { ConsulController } from './consul.controller';

@Global()
@Module({
  controllers: [ConsulController],
  providers: [ConsulService],
  exports: [ConsulService],
})
export class ConsulModule {}
