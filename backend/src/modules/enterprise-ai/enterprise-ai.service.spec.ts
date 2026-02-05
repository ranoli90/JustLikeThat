import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseAiService } from './enterprise-ai.service';

describe('EnterpriseAiService', () => {
  let service: EnterpriseAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnterpriseAiService],
    }).compile();

    service = module.get<EnterpriseAiService>(EnterpriseAiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return healthy status', () => {
    const result = service.getHealth();
    expect(result.status).toBe('healthy');
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should return stats', () => {
    const stats = service.getStats();
    expect(stats.resumeGeneration).toBeDefined();
    expect(stats.coverLetter).toBeDefined();
    expect(stats.jobDescription).toBeDefined();
    expect(stats.careerPath).toBeDefined();
    expect(stats.negotiation).toBeDefined();
    expect(stats.interview).toBeDefined();
  });
});
