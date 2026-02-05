import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { RouteService } from '../services/route.service';
import { HealthCheckService } from '../services/health-check.service';
import { ScalingService } from '../services/scaling.service';
import { CreateRouteDto, UpdateRouteDto, RouteQueryDto } from '../dto/gateway.dto';

@Controller('api/v1/gateway')
export class GatewayController {
  constructor(
    private readonly routeService: RouteService,
    private readonly healthCheckService: HealthCheckService,
    private readonly scalingService: ScalingService,
  ) {}

  // ========== ROUTE MANAGEMENT ==========

  @Get('routes')
  async getRoutes(@Query() query: RouteQueryDto) {
    return this.routeService.findAll(query);
  }

  @Post('routes')
  @HttpCode(HttpStatus.CREATED)
  async createRoute(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Put('routes/:id')
  async updateRoute(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routeService.update(id, updateRouteDto);
  }

  @Delete('routes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoute(@Param('id') id: string) {
    return this.routeService.delete(id);
  }

  @Get('routes/:id')
  async getRoute(@Param('id') id: string) {
    return this.routeService.findOne(id);
  }

  // ========== HEALTH CHECK ENDPOINTS ==========

  @Get('health/live')
  async livenessCheck() {
    return this.healthCheckService.getLiveness();
  }

  @Get('health/ready')
  async readinessCheck() {
    return this.healthCheckService.getReadiness();
  }

  @Get('health/cluster')
  async clusterHealthCheck() {
    return this.healthCheckService.getClusterHealth();
  }

  // ========== SCALING ENDPOINTS ==========

  @Post('scaling/autoscale')
  async triggerAutoscale(@Body() body: { serviceName: string; action: 'scale_up' | 'scale_down' | 'scale_to' }) {
    return this.scalingService.triggerScaling(body);
  }

  @Get('scaling/status')
  async getScalingStatus(@Query('serviceName') serviceName?: string) {
    return this.scalingService.getStatus(serviceName);
  }

  @Put('scaling/policies')
  async updateScalingPolicy(@Body() body: { serviceName: string; policy: any }) {
    return this.scalingService.updatePolicy(body);
  }

  // ========== STATISTICS ==========

  @Get('stats')
  async getStats() {
    return this.routeService.getStatistics();
  }

  @Get('stats/throughput')
  async getThroughput(@Query('timeRange') timeRange: string = '1h') {
    return this.routeService.getThroughput(timeRange);
  }
}
