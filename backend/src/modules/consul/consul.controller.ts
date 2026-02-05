import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ConsulService } from './services/consul.service';

@Controller('api/v1/consul')
export class ConsulController {
  constructor(private readonly consulService: ConsulService) {}

  @Get('services')
  async getAllServices() {
    return this.consulService.getAllServices();
  }

  @Get('services/healthy')
  async getHealthyServices() {
    return this.consulService.getHealthyServices();
  }

  @Get('services/:name/address')
  async getServiceAddress(@Param('name') name: string) {
    const address = await this.consulService.getServiceAddress(name);
    return { serviceName: name, address };
  }

  @Get('health-checks')
  async getHealthChecks() {
    return this.consulService.getHealthChecks();
  }

  @Get('kv/:key')
  async getKV(@Param('key') key: string) {
    const value = await this.consulService.getKV(key);
    return { key, value };
  }

  @Post('kv/:key')
  async putKV(@Param('key') key: string, @Body() body: { value: any }) {
    await this.consulService.putKV(key, body.value);
    return { success: true, key };
  }
}
