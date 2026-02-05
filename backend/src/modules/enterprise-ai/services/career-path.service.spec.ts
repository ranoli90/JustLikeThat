import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareerPathService, CareerPathInput } from './career-path.service';
import { CareerPath } from '../entities/career-path.entity';

describe('CareerPathService', () => {
  let service: CareerPathService;
  let repository: Repository<CareerPath>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CareerPathService,
        { provide: getRepositoryToken(CareerPath), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CareerPathService>(CareerPathService);
    repository = module.get<Repository<CareerPath>>(getRepositoryToken(CareerPath));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCareerPath', () => {
    const mockInput: CareerPathInput = {
      userId: 'user-123',
      currentRole: 'Software Engineer',
      targetRole: 'Senior Software Engineer',
      currentSkills: ['JavaScript', 'React', 'Node.js'],
      experienceYears: 3,
      timeline: 'moderate',
    };

    it('should generate career path', async () => {
      const mockSaved = {
        id: 'path-id',
        userId: mockInput.userId,
        currentRole: mockInput.currentRole,
        targetRole: mockInput.targetRole,
        skillGapAnalysis: { gaps: [], strengths: [] },
        milestones: [],
        certifications: [],
        timeline: {},
        progress: 0,
      };

      mockRepository.create.mockReturnValue(mockSaved);
      mockRepository.save.mockResolvedValue(mockSaved);

      const result = await service.generateCareerPath(mockInput);

      expect(result).toBeDefined();
      expect(result.currentRole).toBe('Software Engineer');
      expect(result.targetRole).toBe('Senior Software Engineer');
    });
  });

  describe('getCareerPath', () => {
    it('should return career path by id', async () => {
      const mockPath = { id: 'path-id', currentRole: 'Engineer', targetRole: 'Manager' };
      mockRepository.findOne.mockResolvedValue(mockPath);

      const result = await service.getCareerPath('path-id');
      expect(result).toEqual(mockPath);
    });
  });
});
