import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IntakeService } from './intake.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('intake')
@UseGuards(JwtAuthGuard)
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post()
  async submitIntake(@Request() req: any, @Body() body: any) {
    return this.intakeService.submitIntake(req.user.id, body);
  }

  @Get('status')
  async getIntakeStatus(@Request() req: any) {
    return this.intakeService.getIntakeStatus(req.user.id);
  }
}
