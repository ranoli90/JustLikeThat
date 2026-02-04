import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IntakeService } from './intake.service';
import { intakeFormSchema, IntakeFormData, DerivedProfile } from '../../dto/intake/intake-questions.zod';
import { ZodValidationPipe } from '../../pipes/zod.pipe';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('api/intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  processIntakeForm(
    @Body(new ZodValidationPipe(intakeFormSchema)) data: IntakeFormData,
  ): DerivedProfile {
    return this.intakeService.processIntakeData(data);
  }
}
