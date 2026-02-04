import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateProfile } from '../../entities/candidate-profile.entity';
import { Resume } from '../../entities/resume.entity';
import { UpdateProfileDto } from '../../dto/profile/update-profile.dto';
import { CreateResumeDto } from '../../dto/resume/create-resume.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(CandidateProfile)
    private profileRepository: Repository<CandidateProfile>,
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
  ) {}

  async getCurrentUserResumes(userId: string, query: any): Promise<any> {
    // Implementation with pagination
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
        page: parseInt(page),
        size: parseInt(size),
        total,
        pages: Math.ceil(total / size),
      },
    };
  }

  async uploadResume(userId: string, uploadDto: any): Promise<any> {
    // Implementation for resume upload
    const resume = this.resumeRepository.create({
      ...uploadDto,
      user: { id: userId },
    });
    const savedResume = await this.resumeRepository.save(resume);
    return savedResume;
  }

  async getCurrentUserPersonas(userId: string, query: any): Promise<any> {
    // Implementation with pagination
    const { page = 1, size = 10 } = query;
    const skip = (page - 1) * size;
    // Since personas aren't in the current TypeORM entities, return mock data
    const data = [];
    const total = 0;
    return {
      data,
      pagination: {
        page: parseInt(page),
        size: parseInt(size),
        total,
        pages: Math.ceil(total / size),
      },
    };
  }

  async getPersonaById(userId: string, personaId: string): Promise<any> {
    // Implementation to get persona by ID
    throw new NotFoundException('Persona not found');
  }

  async createPersona(userId: string, createPersonaDto: any): Promise<any> {
    // Implementation to create persona
    return {
      id: 'mock-persona-id',
      ...createPersonaDto,
    };
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
