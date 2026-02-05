import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProfile } from '../../entities/candidate-profile.entity';
import { Resume } from '../../entities/resume.entity';
import { UpdateProfileDto } from '../../dto/profile/update-profile.dto';
import { CreateResumeDto } from '../../dto/resume/create-resume.dto';
import { Persona } from '../../entities/persona.entity';
import { PaginatedResponse, PaginationQuery } from '../../common/utils';

/**
 * Profile query parameters
 */
export interface ProfileQuery extends PaginationQuery {}

/**
 * Persona entity interface
 */
export interface PersonaData {
  id: string;
  name: string;
  description: string;
  skills: string[];
  experience: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service for managing candidate profiles, resumes, and personas
 */
@Injectable()
export class ProfileService {
  /**
   * Creates a new ProfileService instance
   * @param profileRepository - Repository for candidate profiles
   * @param resumeRepository - Repository for resumes
   */
  constructor(
    @InjectRepository(CandidateProfile)
    private profileRepository: Repository<CandidateProfile>,
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
  ) {}

  /**
   * Retrieves paginated resumes for a user
   * @param userId - The user ID
   * @param query - Pagination query parameters
   * @returns Paginated list of resumes
   */
  async getCurrentUserResumes(userId: string, query: ProfileQuery = {}): Promise<PaginatedResponse<Resume>> {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;
    const [data, total] = await this.resumeRepository.findAndCount({
      where: { user: { id: userId } },
      skip,
      take: size,
    });
    return {
      data,
      pagination: {
        page: Number(page),
        size: Number(size),
        total,
        pages: Math.ceil(total / size),
      },
    };
  }

  /**
   * Uploads a new resume for a user
   * @param userId - The user ID
   * @param uploadDto - Resume upload data
   * @returns The created resume
   */
  async uploadResume(userId: string, uploadDto: Partial<Resume>): Promise<Resume> {
    const resume = this.resumeRepository.create({
      ...uploadDto,
      user: { id: userId },
    });
    return this.resumeRepository.save(resume);
  }

  /**
   * Retrieves paginated personas for a user
   * @param userId - The user ID
   * @param query - Pagination query parameters
   * @returns Paginated list of personas
   */
  async getCurrentUserPersonas(userId: string, query: ProfileQuery = {}): Promise<PaginatedResponse<PersonaData>> {
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;
    // Since personas aren't in the current TypeORM entities, return mock data
    const data: PersonaData[] = [];
    const total = 0;
    return {
      data,
      pagination: {
        page: Number(page),
        size: Number(size),
        total,
        pages: Math.ceil(total / size),
      },
    };
  }

  /**
   * Retrieves a specific persona by ID
   * @param userId - The user ID
   * @param personaId - The persona ID
   * @returns The persona
   * @throws NotFoundException if persona not found
   */
  async getPersonaById(userId: string, personaId: string): Promise<PersonaData> {
    throw new NotFoundException('Persona not found');
  }

  /**
   * Creates a new persona
   * @param userId - The user ID
   * @param createPersonaDto - Persona creation data
   * @returns The created persona
   */
  async createPersona(userId: string, createPersonaDto: Partial<PersonaData>): Promise<PersonaData> {
    return {
      id: 'mock-persona-id',
      ...createPersonaDto,
    } as PersonaData;
  }

  async updatePersona(userId: string, personaId: string, updatePersonaDto: any): Promise<any> {
    // Implementation to update persona
    return {
      id: personaId,
      ...updatePersonaDto,
    };
  }

  async deletePersona(userId: string, personaId: string): Promise<void> {
    // Implementation to delete persona
  }

  async getCurrentUserProfile(userId: string): Promise<CandidateProfile> {
    const profile = await this.profileRepository.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async updateCurrentUserProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<CandidateProfile> {
    const profile = await this.getCurrentUserProfile(userId);
    Object.assign(profile, updateProfileDto);
    return this.profileRepository.save(profile);
  }



  async getResumeById(userId: string, resumeId: string): Promise<Resume> {
    const resume = await this.resumeRepository.findOne({
      where: { id: resumeId, user: { id: userId } },
    });
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }
    return resume;
  }

  async createResume(userId: string, createResumeDto: CreateResumeDto): Promise<Resume> {
    // If isPrimary is true, set all other resumes to not primary
    if (createResumeDto.isPrimary) {
      await this.resumeRepository.update({ user: { id: userId }, isPrimary: true }, { isPrimary: false });
    }

    const resume = this.resumeRepository.create({
      ...createResumeDto,
      user: { id: userId },
    });
    return this.resumeRepository.save(resume);
  }

  async deleteResume(userId: string, resumeId: string): Promise<void> {
    const resume = await this.getResumeById(userId, resumeId);
    await this.resumeRepository.remove(resume);
  }

  async parseResume(userId: string, resumeId: string): Promise<Resume> {
    // In a real implementation, this would call a resume parser API
    // For now, we'll just return the resume with a placeholder parsed data
    const resume = await this.getResumeById(userId, resumeId);
    resume.parsedData = {
      parsed: true,
      timestamp: new Date(),
      data: {
        // Placeholder data
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        summary: 'Software engineer with 5 years of experience',
        skills: ['JavaScript', 'TypeScript', 'React'],
        experience: [
          {
            company: 'Acme Corp',
            title: 'Senior Software Engineer',
            startDate: '2020-01-01',
            endDate: 'Present',
          },
        ],
        education: [
          {
            school: 'University of Example',
            degree: 'B.S. in Computer Science',
            graduationDate: '2019-05-01',
          },
        ],
      },
    };
    return this.resumeRepository.save(resume);
  }
}
