import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume } from '../../entities/resume.entity';
import { CandidateProfile } from '../../entities/candidate-profile.entity';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import { ConfigService } from '@nestjs/config';

export interface ParsedResume {
  rawText: string;
  extractedData: {
    contactInfo: {
      email?: string;
      phone?: string;
      linkedin?: string;
      location?: string;
    };
    skills: string[];
    experience: ExperienceEntry[];
    education: EducationEntry[];
    summary?: string;
    totalYearsExperience?: number;
  };
  confidenceScore: number;
  parsingMetadata: {
    parsedAt: Date;
    parserVersion: string;
    processingTime: number;
  };
}

export interface ExperienceEntry {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current: boolean;
  description: string;
  skills?: string[];
}

export interface EducationEntry {
  institution: string;
  degree?: string;
  field?: string;
  graduationYear?: string;
  gpa?: string;
}

export interface ResumeParseOptions {
  extractSkills?: boolean;
  extractExperience?: boolean;
  extractEducation?: boolean;
  extractContactInfo?: boolean;
  confidenceThreshold?: number;
}

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);
  private readonly SKILL_KEYWORDS = new Set([
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'csharp', 'c++', 'c', 'ruby', 'go', 'golang',
    'rust', 'scala', 'kotlin', 'swift', 'php', 'perl', 'r', 'matlab', 'julia',
    // Frontend
    'react', 'reactjs', 'angular', 'vue', 'vuejs', 'svelte', 'nextjs', 'nuxt', 'html', 'css',
    'sass', 'less', 'tailwind', 'bootstrap', 'jquery', 'webpack', 'vite', 'parcel',
    // Backend
    'node', 'nodejs', 'express', 'nestjs', 'fastify', 'django', 'flask', 'spring',
    'springboot', 'rails', 'laravel', 'asp.net', '.net', 'dotnet',
    // Databases
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
    'dynamodb', 'firebase', 'supabase', 'oracle', 'sqlite', 'mariadb', 'cassandra',
    'couchdb', 'neo4j', 'graphql', 'prisma', 'typeorm', 'sequelize', 'mongoose',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins',
    'github actions', 'gitlab ci', 'circleci', 'terraform', 'ansible', 'puppet', 'chef',
    'helm', 'istio', 'linkerd', 'nginx', 'apache', 'caddy',
    // Data Science & ML
    'machine learning', 'ml', 'deep learning', 'tensorflow', 'pytorch', 'keras',
    'scikit-learn', 'sklearn', 'pandas', 'numpy', 'spark', 'hadoop', 'airflow',
    'data pipeline', 'etl', 'data warehouse', 'snowflake', 'databricks',
    // Other Tools & Concepts
    'git', 'agile', 'scrum', 'kanban', 'ci/cd', 'microservices', 'rest', 'api',
    'grpc', 'websockets', 'oauth', 'jwt', 'sso', 'oauth2', 'ldap',
    'test-driven development', 'tdd', 'bdd', 'unit testing', 'integration testing',
    'e2e testing', 'jest', 'mocha', 'pytest', 'junit', 'selenium', 'cypress',
    'design patterns', 'oop', 'solid', 'clean code', 'refactoring',
  ]);

  private readonly EXPERIENCE_PATTERNS = [
    /(?:(?:senior|junior|lead|principal|staff|chief|head|director|manager|vp|executive)\s+)?(?:software|web|mobile|full\s*stack|front\s*end|back\s*end|data|devops|cloud|ml|ai|solutions|platform)\s*(?:engineer|developer|architect|manager|lead)?/gi,
    /(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{4}\s*[-–—to]+\s*(?:(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{4}|present|current|now)/gi,
    /(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*\d{4}/gi,
  ];

  private readonly EDUCATION_PATTERNS = [
    /((?:bachelor'?s?|master'?s?|ph\.?d\.?|doctorate|associate|mba|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|b\.?eng\.?|m\.?eng\.?|b\.?sc\.?|m\.?sc\.?|b\.?comp\.?|m\.?comp\.?)(?:\s+(?:of|in|of\s+science|of\s+arts|of\s+engineering|of\s+computer\s+science|of\s+software\s+engineering)?)?(?:\s+degree)?)/gi,
    /(university|college|institute|school)\s+of\s+[\w\s]+/gi,
    /[\w\s]+\s+(?:university|college|institute|school)/gi,
  ];

  constructor(
    @InjectRepository(Resume)
    private resumeRepository: Repository<Resume>,
    @InjectRepository(CandidateProfile)
    private profileRepository: Repository<CandidateProfile>,
  ) {}

  async parseResume(buffer: Buffer, mimeType: string): Promise<ParsedResume> {
    const startTime = Date.now();
    const parserVersion = '1.0.0';

    try {
      let rawText: string;

      if (mimeType === 'application/pdf') {
        rawText = await this.parsePdf(buffer);
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        rawText = await this.parseDocx(buffer);
      } else if (mimeType === 'text/plain') {
        rawText = buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const extractedData = await this.extractStructuredData(rawText);
      const confidenceScore = this.calculateConfidenceScore(rawText, extractedData);

      const result: ParsedResume = {
        rawText,
        extractedData,
        confidenceScore,
        parsingMetadata: {
          parsedAt: new Date(),
          parserVersion,
          processingTime: Date.now() - startTime,
        },
      };

      this.logger.log(`Resume parsed successfully in ${result.parsingMetadata.processingTime}ms with confidence ${confidenceScore}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to parse resume: ${error.message}`);
      throw error;
    }
  }

  private async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  private async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  private async extractStructuredData(rawText: string): Promise<ParsedResume['extractedData']> {
    const contactInfo = this.extractContactInfo(rawText);
    const skills = this.extractSkills(rawText);
    const experience = this.extractExperience(rawText);
    const education = this.extractEducation(rawText);
    const summary = this.extractSummary(rawText);
    const totalYearsExperience = this.calculateTotalYears(experience);

    return {
      contactInfo,
      skills,
      experience,
      education,
      summary,
      totalYearsExperience,
    };
  }

  private extractContactInfo(text: string): ParsedResume['extractedData']['contactInfo'] {
    const result: ParsedResume['extractedData']['contactInfo'] = {};

    // Email regex
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails && emails.length > 0) {
      result.email = emails[0];
    }

    // Phone regex (various formats)
    const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex);
    if (phones && phones.length > 0) {
      result.phone = phones[0];
    }

    // LinkedIn
    const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/gi;
    const linkedins = text.match(linkedinRegex);
    if (linkedins && linkedins.length > 0) {
      result.linkedin = linkedins[0];
    }

    // Location (simple heuristic)
    const locationRegex = /(?:located in|based in|location|)\s*:?\s*([A-Z][a-zA-Z]+(?:\s*,\s*[A-Z]{2})?)/g;
    const locations = text.match(locationRegex);
    if (locations && locations.length > 0) {
      result.location = locations[0].replace(/^(?:located in|based in|location)\s*:?\s*/i, '').trim();
    }

    return result;
  }

  private extractSkills(text: string): string[] {
    const foundSkills = new Set<string>();
    const lowerText = text.toLowerCase();

    // Check for skill keywords
    for (const skill of this.SKILL_KEYWORDS) {
      if (lowerText.includes(skill.toLowerCase())) {
        // Normalize skill name
        const normalized = this.normalizeSkillName(skill);
        foundSkills.add(normalized);
      }
    }

    // Look for skills in a dedicated skills section
    const skillsSectionRegex = /(?:skills|technical skills|core competencies|technologies|tools)[\s:]*([\s\S]*?)(?=\n\n|\nexperience|\neducation|$)/i;
    const skillsSectionMatch = text.match(skillsSectionRegex);
    if (skillsSectionMatch) {
      const skillsFromSection = this.parseSkillsList(skillsSectionMatch[1]);
      skillsFromSection.forEach(skill => foundSkills.add(skill));
    }

    return Array.from(foundSkills);
  }

  private normalizeSkillName(skill: string): string {
    const normalizationMap: Record<string, string> = {
      'reactjs': 'React',
      'react': 'React',
      'vuejs': 'Vue.js',
      'vue': 'Vue.js',
      'nodejs': 'Node.js',
      'node': 'Node.js',
      'nextjs': 'Next.js',
      'angularjs': 'Angular',
      'angular': 'Angular',
      'typescript': 'TypeScript',
      'javascript': 'JavaScript',
      'python': 'Python',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'aws': 'AWS',
      'gcp': 'GCP',
      'machine learning': 'Machine Learning',
      'deep learning': 'Deep Learning',
      'tensorflow': 'TensorFlow',
      'pytorch': 'PyTorch',
      'scikit-learn': 'Scikit-learn',
      'pandas': 'Pandas',
      'numpy': 'NumPy',
      'graphql': 'GraphQL',
      'sql': 'SQL',
      'microservices': 'Microservices',
    };

    const lowerSkill = skill.toLowerCase();
    return normalizationMap[lowerSkill] || skill;
  }

  private parseSkillsList(skillsText: string): string[] {
    const skills = new Set<string>();

    // Split by common delimiters
    const tokens = skillsText.split(/[,;|•·\n\r]+/);

    for (const token of tokens) {
      const cleaned = token.trim().replace(/[•·]/g, '').trim();
      if (cleaned.length >= 2 && cleaned.length <= 50) {
        skills.add(this.normalizeSkillName(cleaned));
      }
    }

    return Array.from(skills);
  }

  private extractExperience(text: string): ExperienceEntry[] {
    const experiences: ExperienceEntry[] = [];

    // Split by common section headers
    const sections = text.split(/\nexperience\b/i);

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];

      // Look for job entries
      const jobEntries = section.split(/(?=\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{4})/gi);

      for (const entry of jobEntries) {
        const parsed = this.parseJobEntry(entry);
        if (parsed) {
          experiences.push(parsed);
        }
      }
    }

    return experiences;
  }

  private parseJobEntry(entry: string): ExperienceEntry | null {
    if (entry.length < 20) return null;

    const lines = entry.split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    const result: ExperienceEntry = {
      title: '',
      company: '',
      current: false,
      description: lines.slice(1).join('\n'),
    };

    // Try to extract title and company from first line
    const firstLine = lines[0];

    // Common patterns: "Title at Company" or "Company - Title" or "Title, Company"
    const titleAtCompany = firstLine.match(/^([^-•,]+)\s+(?:at|@|-|,)\s+([^-•,]+)$/);
    if (titleAtCompany) {
      result.title = titleAtCompany[1].trim();
      result.company = titleAtCompany[2].trim();
    } else if (firstLine.includes(' at ')) {
      const parts = firstLine.split(' at ');
      result.title = parts[0].trim();
      result.company = parts[1].trim();
    } else {
      // Default: first line is title, second is company
      result.title = firstLine.trim();
      if (lines.length > 1) {
        result.company = lines[1].trim();
      }
    }

    // Check for date range
    const dateMatch = firstLine.match(/((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*\d{4})\s*[-–—to]+\s*((?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s*\d{4}|present|current|now)/gi);
    if (dateMatch) {
      result.startDate = dateMatch[1];
      const endDate = dateMatch[2];
      result.current = /present|current|now/i.test(endDate);
      result.endDate = result.current ? 'Present' : endDate;
    }

    return result;
  }

  private extractEducation(text: string): EducationEntry[] {
    const education: EducationEntry[] = [];

    // Split by education section
    const sections = text.split(/\neducation\b/i);

    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];

      // Look for degree patterns
      const degreeMatches = section.match(/((?:bachelor'?s?|master'?s?|ph\.?d\.?|doctorate|associate|mba|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|b\.?eng\.?|m\.?eng\.?|b\.?sc\.?|m\.?sc\.?|b\.?comp\.?|m\.?comp\.?)(?:\s+(?:of|in|of\s+science|of\s+arts|of\s+engineering|of\s+computer\s+science|of\s+software\s+engineering)?)?(?:\s+degree)?)/gi);

      if (degreeMatches) {
        for (const degreeMatch of degreeMatches) {
          const entry: EducationEntry = {
            institution: '',
            degree: degreeMatch.trim(),
          };

          // Try to find institution near degree
          const institutionMatch = section.match(new RegExp(`(${degreeMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*[,–-]?\\s*([^-•,]+(?:university|college|institute|school)/gi`, 'i'));
          if (institutionMatch) {
            entry.institution = institutionMatch[2].trim();
          }

          // Look for graduation year
          const yearMatch = section.match(/\b(19|20)\d{2}\b/);
          if (yearMatch) {
            entry.graduationYear = yearMatch[0];
          }

          education.push(entry);
        }
      }
    }

    return education;
  }

  private extractSummary(text: string): string | undefined {
    // Look for summary or objective section
    const summaryRegex = /(?:summary|objective|profile|about)\s*[:\n]([\s\S]*?)(?=\n\n|\nexperience|\neducation|\nskills|$)/i;
    const match = text.match(summaryRegex);

    if (match && match[1]) {
      const summary = match[1].trim();
      if (summary.length >= 20 && summary.length <= 500) {
        return summary;
      }
    }

    return undefined;
  }

  private calculateTotalYears(experiences: ExperienceEntry[]): number {
    if (experiences.length === 0) return 0;

    let totalMonths = 0;

    for (const exp of experiences) {
      if (exp.startDate) {
        const startDate = this.parseDate(exp.startDate);
        const endDate = exp.current ? new Date() : (exp.endDate ? this.parseDate(exp.endDate) : new Date());

        if (startDate && endDate) {
          const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
          totalMonths += Math.max(0, months);
        }
      }
    }

    return Math.round(totalMonths / 12);
  }

  private parseDate(dateStr: string): Date | null {
    try {
      // Try parsing various date formats
      const cleaned = dateStr.replace(/[.,]/g, ' ').trim();
      const parsed = new Date(cleaned);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }

  private calculateConfidenceScore(rawText: string, extractedData: ParsedResume['extractedData']): number {
    let score = 0;
    const maxScore = 100;

    // Check text length (10 points)
    const textLength = rawText.length;
    if (textLength >= 500) score += 10;
    else if (textLength >= 200) score += 5;

    // Email found (10 points)
    if (extractedData.contactInfo.email) score += 10;

    // Skills found (20 points)
    const skillsCount = extractedData.skills.length;
    if (skillsCount >= 10) score += 20;
    else if (skillsCount >= 5) score += 15;
    else if (skillsCount >= 1) score += 5;

    // Experience found (20 points)
    const expCount = extractedData.experience.length;
    if (expCount >= 3) score += 20;
    else if (expCount >= 1) score += 10;

    // Education found (10 points)
    if (extractedData.education.length > 0) score += 10;

    // Summary found (10 points)
    if (extractedData.summary) score += 10;

    // Phone found (10 points)
    if (extractedData.contactInfo.phone) score += 10;

    // Location found (10 points)
    if (extractedData.contactInfo.location) score += 10;

    return Math.min(score, maxScore);
  }

  async enrichProfileWithResume(profileId: string, parsedResume: ParsedResume): Promise<CandidateProfile> {
    const profile = await this.profileRepository.findOne({ where: { id: profileId } });

    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`);
    }

    // Update profile with extracted data
    if (parsedResume.extractedData.summary) {
      profile.summary = parsedResume.extractedData.summary;
    }

    if (parsedResume.extractedData.skills.length > 0) {
      profile.skills = parsedResume.extractedData.skills as unknown as any[];
    }

    if (parsedResume.extractedData.experience.length > 0) {
      profile.experiences = parsedResume.extractedData.experience as unknown as any[];
    }

    if (parsedResume.extractedData.education.length > 0) {
      profile.education = parsedResume.extractedData.education as unknown as any[];
    }

    return this.profileRepository.save(profile);
  }
}
