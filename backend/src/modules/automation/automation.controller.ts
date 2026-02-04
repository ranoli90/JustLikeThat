import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AutomationService } from './automation.service';
import { paginationSchema } from '../../dto/common/pagination.zod';
import type { PaginationQueryDto } from '../../dto/common/pagination.zod';
import { createAutomationSchema, updateAutomationSchema } from '../../dto/automation/create-automation.zod';
import type { CreateAutomationDto, UpdateAutomationDto } from '../../dto/automation/create-automation.zod';
import { ZodValidationPipe } from '../../pipes/zod.pipe';

@Controller('api/automation')
export class AutomationController {
  constructor(private automationService: AutomationService) {}

  @Get('configs')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(paginationSchema))
  async getAutomationConfigs(@Request() req, @Query() query: PaginationQueryDto) {
    return this.automationService.getAutomationConfigs(req.user.id, query);
  }

  @Get('configs/:id')
  @UseGuards(JwtAuthGuard)
  async getAutomationConfigById(@Request() req, @Param('id') id: string) {
    return this.automationService.getAutomationConfigById(req.user.id, id);
  }

  @Post('configs')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(createAutomationSchema))
  async createAutomationConfig(@Request() req, @Body() createAutomationDto: CreateAutomationDto) {
    return this.automationService.createAutomationConfig(req.user.id, createAutomationDto);
  }

  @Put('configs/:id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(updateAutomationSchema))
  async updateAutomationConfig(@Request() req, @Param('id') id: string, @Body() updateAutomationDto: UpdateAutomationDto) {
    return this.automationService.updateAutomationConfig(req.user.id, id, updateAutomationDto);
  }

  @Delete('configs/:id')
  @UseGuards(JwtAuthGuard)
  async deleteAutomationConfig(@Request() req, @Param('id') id: string) {
    return this.automationService.deleteAutomationConfig(req.user.id, id);
  }

  @Post('configs/:id/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleAutomationConfig(@Request() req, @Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.automationService.toggleAutomationConfig(req.user.id, id, body.enabled);
  }

  @Get('configs/:id/preview')
  @UseGuards(JwtAuthGuard)
  async previewAutomationConfig(@Request() req, @Param('id') id: string) {
    return this.automationService.previewAutomationConfig(req.user.id, id);
  }
}
