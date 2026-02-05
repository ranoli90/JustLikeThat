import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobDescription } from '../entities/job-description.entity';

export interface JobDescriptionInput {
  tenantId: string;
  role: string;
  department?: string;
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  industry: string;
  requirements: {
    required: string[];
    preferred?: string[];
  };
  responsibilities: string[];
  remotePolicy?: 'remote' | 'hybrid' | 'onsite';
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  benefits?: string[];
}

const roleTemplates: Record<string, any> = {
  'software engineer': {
    title: 'Software Engineer',
    department: 'Engineering',
    responsibilities: [
      'Design, develop, and maintain software applications',
      'Collaborate with cross-functional teams',
      'Write clean, efficient, and documented code',
      'Participate in code reviews',
      'Troubleshoot and debug issues',
    ],
    requirements: {
      required: [
        'Bachelor\'s degree in Computer Science or equivalent',
        '3+ years of software development experience',
        'Proficiency in at least one programming language',
        'Experience with version control systems',
      ],
      preferred: [
        'Experience with cloud platforms',
        'Familiarity with CI/CD pipelines',
        'Open source contributions',
      ],
    },
  },
};

@Injectable()
export class JobDescriptionGenerationService {
  private readonly logger = new Logger(JobDescriptionGenerationService.name);

  constructor(
    @InjectRepository(JobDescription)
    private readonly jobDescriptionRepository: Repository<JobDescription>,
  ) {}

  async generateJobDescription(input: JobDescriptionInput): Promise<any> {
    this.logger.log(`Generating job description for role ${input.role}`);
    const startTime = Date.now();

    const template = this.selectTemplate(input.role);
    const content = this.generateContent(input, template);
    const salaryRange = input.salaryRange || this.getSalaryBenchmark(input);

    const jobDescription = this.jobDescriptionRepository.create({
      tenantId: input.tenantId,
      title: input.role,
      department: input.department || template.department,
      content,
      eeocCompliant: true,
      salaryRange,
      templatesUsed: [template.id],
    });

    const saved = await this.jobDescriptionRepository.save(jobDescription);
    const duration = Date.now() - startTime;
    this.logger.log(`Job description generated in ${duration}ms`);

    return {
      id: saved.id,
      title: saved.title,
      content: saved.content,
      eeocCompliant: saved.eeocCompliant,
      salaryRange: saved.salaryRange,
      createdAt: saved.createdAt,
    };
  }

  private selectTemplate(role: string): any {
    const roleKey = role.toLowerCase();
    return roleTemplates[roleKey] || roleTemplates['software engineer'];
  }

  private generateContent(input: JobDescriptionInput, template: any): any {
    return {
      overview: `We are looking for a ${input.level} ${template.title} to join our team.`,
      responsibilities: [...template.responsibilities, ...input.responsibilities].slice(0, 8),
      requirements: {
        required: [...template.requirements.required, ...input.requirements.required],
        preferred: [...(template.requirements.preferred || []), ...(input.requirements.preferred || [])],
      },
      benefits: input.benefits || ['Competitive salary', 'Health insurance', '401k matching'],
      eeocStatement: 'We are an equal opportunity employer.',
    };
  }

  private getSalaryBenchmark(input: JobDescriptionInput): any {
    return {
      min: 80000,
      max: 150000,
      currency: 'USD',
      median: 115000,
      source: 'Market Benchmarks',
    };
  }

  async getJobDescription(id: string): Promise<JobDescription | null> {
    return this.jobDescriptionRepository.findOne({ where: { id } });
  }

  async getTemplates(): Promise<any[]> {
    return Object.entries(roleTemplates).map(([key, value]) => ({ role: key, ...value }));
  }
}
