import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('jobs')
  async getMatches(@Request() req: any, @Query('limit') limit?: string) {
    return this.matchingService.getMatchesForUser(req.user.id, {
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get('score/:personaId/:jobPostingId')
  async getMatchScore(
    @Param('personaId') personaId: string,
    @Param('jobPostingId') jobPostingId: string,
  ) {
    return this.matchingService.getMatchScore(personaId, jobPostingId);
  }
}
