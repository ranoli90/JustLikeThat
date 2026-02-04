import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { MatchingService, MatchResult } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get(':personaId/matches')
  async findMatches(@Param('personaId') personaId: string): Promise<MatchResult[]> {
    return this.matchingService.findMatches(personaId);
  }

  @Post('score')
  async calculateMatchScore(
    @Body() body: { personaId: string; jobPostingId: string },
  ): Promise<MatchResult> {
    return this.matchingService.calculateMatchScore(
      body.personaId,
      body.jobPostingId,
    );
  }

  @Get('validation')
  async validateScoringLogic() {
    return this.matchingService.validateScoringLogic();
  }

  @Get('evaluation-plan')
  async getEvaluationPlan() {
    return this.matchingService.getEvaluationPlan();
  }

  @Get('spam-checklist')
  async getSpamChecklist() {
    return this.matchingService.getSpamChecklist();
  }

  @Get('assumptions')
  async getAssumptionsForHumanReview() {
    return this.matchingService.getAssumptionsForHumanReview();
  }
}
