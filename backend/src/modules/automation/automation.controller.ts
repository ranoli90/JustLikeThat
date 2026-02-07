import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AutomationService } from './automation.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('rules')
  async createRule(@Request() req: any, @Body() body: any) {
    return this.automationService.createRule(req.user.id, body);
  }

  @Get('rules')
  async getRules(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.automationService.getRules(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('rules/:id')
  async getRuleById(@Request() req: any, @Param('id') id: string) {
    return this.automationService.getRuleById(req.user.id, id);
  }

  @Put('rules/:id')
  async updateRule(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.automationService.updateRule(req.user.id, id, body);
  }

  @Delete('rules/:id')
  async deleteRule(@Request() req: any, @Param('id') id: string) {
    return this.automationService.deleteRule(req.user.id, id);
  }

  @Post('rules/:id/toggle')
  async toggleRule(@Request() req: any, @Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.automationService.toggleRule(req.user.id, id, isActive);
  }

  @Post('rules/:id/execute')
  async executeRule(@Request() req: any, @Param('id') id: string) {
    return this.automationService.executeRule(req.user.id, id);
  }
}
