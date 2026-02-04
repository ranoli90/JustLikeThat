import { Injectable } from '@nestjs/common';
import { Persona } from '../../entities/persona.entity';
import { JobPosting } from '../../entities/job-posting.entity';

export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  tone: 'PROFESSIONAL' | 'INNOVATIVE' | 'TRADITIONAL' | 'ENTHUSIASTIC' | 'CASUAL';
  sections: TemplateSection[];
  variables: string[];
}

export interface TemplateSection {
  type: 'OPENING' | 'BODY' | 'CLOSING' | 'SIGNATURE';
  template: string;
  order: number;
}

export interface CoverLetterGenerationOptions {
  templateId?: string;
  tone?: string;
  jobLevel?: 'JUNIOR' | 'MID' | 'SENIOR' | 'EXECUTIVE';
  customSections?: Record<string, string>;
  includeMetrics?: boolean;
  includeCompanyResearch?: boolean;
}

export interface GeneratedCoverLetter {
  content: string;
  templateUsed: string;
  toneApplied: string;
  sections: GeneratedSection[];
  keyPointsCovered: string[];
  customizationNotes: string[];
}

interface GeneratedSection {
  type: string;
  content: string;
}

@Injectable()
export class CoverLetterGeneratorService {
  private templates: Map<string, CoverLetterTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Professional template
    this.templates.set('professional-standard', {
      id: 'professional-standard',
      name: 'Professional Standard',
      description: 'A formal, professional cover letter suitable for corporate positions',
      tone: 'PROFESSIONAL',
      sections: [
        {
          type: 'OPENING',
          order: 1,
          template: `Dear Hiring Manager,
{{GREETING}}`,
        },
        {
          type: 'BODY',
          order: 2,
          template: `I am writing to express my strong interest in the {{JOB_TITLE}} position at {{COMPANY_NAME}}. With my extensive background in {{RELEVANT_SKILLS}} and {{YEARS_EXPERIENCE}} years of experience, I am confident in my ability to contribute significantly to your team.

{{PERSONAL_CONNECTION}}
{{_VALUE_PROPOSITION}}
{{_RELEVANT_EXPERIENCE}}`,
        },
        {
          type: 'CLOSING',
          order: 3,
          template: `I am enthusiastic about the opportunity to bring my unique blend of skills and experience to {{COMPANY_NAME}}. I would welcome the chance to discuss how my background aligns with your team's goals.

{{_CALL_TO_ACTION}}`,
        },
        {
          type: 'SIGNATURE',
          order: 4,
          template: `Thank you for your time and consideration.

Sincerely,
{{CANDIDATE_NAME}}
{{CONTACT_INFORMATION}}`,
        },
      ],
      variables: ['JOB_TITLE', 'COMPANY_NAME', 'GREETING', 'RELEVANT_SKILLS', 'YEARS_EXPERIENCE', 'PERSONAL_CONNECTION', 'VALUE_PROPOSITION', 'RELEVANT_EXPERIENCE', 'CALL_TO_ACTION', 'CANDIDATE_NAME', 'CONTACT_INFORMATION'],
    });

    // Innovative template
    this.templates.set('innovative-startup', {
      id: 'innovative-startup',
      name: 'Innovation Focus',
      description: 'Dynamic and forward-thinking cover letter for startup and tech companies',
      tone: 'INNOVATIVE',
      sections: [
        {
          type: 'OPENING',
          order: 1,
          template: `Hello {{COMPANY_NAME}} Team,
{{HOOK}}`,
        },
        {
          type: 'BODY',
          order: 2,
          template: `As a passionate professional specializing in {{RELEVANT_SKILLS}}, I've been following {{COMPANY_NAME}}'s innovative journey with great interest. Your commitment to {{COMPANY_VALUES}} resonates deeply with my own professional philosophy.

{{_INNOVATION_EXAMPLE}}
{{_ALIGNMENT_STATEMENT}}
{{_UNIQUE_VALUE}}`,
        },
        {
          type: 'CLOSING',
          order: 3,
          template: `I'm excited about the possibility of joining a team that {{COMPANY_GOALS}}. The opportunity to {{_CONTRIBUTION_VISION}} would be incredibly rewarding.

{{_NEXT_STEPS}}`,
        },
        {
          type: 'SIGNATURE',
          order: 4,
          template: `Ready to make an impact,
{{CANDIDATE_NAME}}
{{CONTACT_INFORMATION}}`,
        },
      ],
      variables: ['COMPANY_NAME', 'HOOK', 'RELEVANT_SKILLS', 'COMPANY_VALUES', 'INNOVATION_EXAMPLE', 'ALIGNMENT_STATEMENT', 'UNIQUE_VALUE', 'COMPANY_GOALS', 'CONTRIBUTION_VISION', 'NEXT_STEPS', 'CANDIDATE_NAME', 'CONTACT_INFORMATION'],
    });

    // Enthusiastic template
    this.templates.set('enthusiastic-candidate', {
      id: 'enthusiastic-candidate',
      name: 'Enthusiastic Candidate',
      description: 'Warm and enthusiastic cover letter that shows genuine excitement for the role',
      tone: 'ENTHUSIASTIC',
      sections: [
        {
          type: 'OPENING',
          order: 1,
          template: `Dear {{COMPANY_NAME}} Hiring Team,
{{EXCITEMENT_HOOK}}`,
        },
        {
          type: 'BODY',
          order: 2,
          template: `I am absolutely thrilled to apply for the {{JOB_TITLE}} role! With my passion for {{RELEVANT_SKILLS}} and dedication to excellence, I believe this is the perfect opportunity to combine my skills with a team I greatly admire.

{{_PASION_PROJECT}}
{{_COMPANY_ADMIRATION}}
{{_MUTUAL_BENEFIT}}`,
        },
        {
          type: 'CLOSING',
          order: 3,
          template: `The prospect of joining {{COMPANY_NAME}} fills me with excitement. I am eager to bring my energy and expertise to contribute to your continued success.

{{_CONTACT_INVITATION}}`,
        },
        {
          type: 'SIGNATURE',
          order: 4,
          template: `With enthusiasm,
{{CANDIDATE_NAME}}
{{CONTACT_INFORMATION}}`,
        },
      ],
      variables: ['COMPANY_NAME', 'EXCITEMENT_HOOK', 'JOB_TITLE', 'RELEVANT_SKILLS', 'PASION_PROJECT', 'COMPANY_ADMIRATION', 'MUTUAL_BENEFIT', 'CONTACT_INVITATION', 'CANDIDATE_NAME', 'CONTACT_INFORMATION'],
    });

    // Executive template
    this.templates.set('executive-leadership', {
      id: 'executive-leadership',
      name: 'Executive Leadership',
      description: 'Sophisticated cover letter for senior and executive positions',
      tone: 'PROFESSIONAL',
      sections: [
        {
          type: 'OPENING',
          order: 1,
          template: `Dear {{HIRING_COMMITTEE}}/{{TITLE_REFEREE}},
{{_EXECUTIVE_SUMMARY}}`,
        },
        {
          type: 'BODY',
          order: 2,
          template: `Throughout my {{YEARS_EXPERIENCE}}-year career in {{INDUSTRY}}, I have consistently delivered results that align with {{COMPANY_NAME}}'s strategic objectives. My background encompasses:

{{_LEADERSHIP_ACHIEVEMENTS}}
{{_STRATEGIC_INITIATIVES}}
{{_TEAM_TRANSFORMATIONS}}

These experiences have prepared me to {{_EXECUTIVE_ROLE_VISION}} at {{COMPANY_NAME}}.`,
        },
        {
          type: 'CLOSING',
          order: 3,
          template: `I would welcome the opportunity to discuss how my executive experience and strategic vision can contribute to {{COMPANY_NAME}}'s continued growth and success.

{{_EXECUTIVE_NEXT_STEPS}}`,
        },
        {
          type: 'SIGNATURE',
          order: 4,
          template: `Respectfully,
{{CANDIDATE_NAME}}
{{TITLE}}
{{CONTACT_INFORMATION}}`,
        },
      ],
      variables: ['HIRING_COMMITTEE', 'TITLE_REFEREE', 'EXECUTIVE_SUMMARY', 'YEARS_EXPERIENCE', 'INDUSTRY', 'COMPANY_NAME', 'LEADERSHIP_ACHIEVEMENTS', 'STRATEGIC_INITIATIVES', 'TEAM_TRANSFORMATIONS', 'EXECUTIVE_ROLE_VISION', 'EXECUTIVE_NEXT_STEPS', 'CANDIDATE_NAME', 'TITLE', 'CONTACT_INFORMATION'],
    });

    // Technical template
    this.templates.set('technical-specialist', {
      id: 'technical-specialist',
      name: 'Technical Specialist',
      description: 'Cover letter focused on technical skills and achievements for engineering roles',
      tone: 'PROFESSIONAL',
      sections: [
        {
          type: 'OPENING',
          order: 1,
          template: `Dear {{COMPANY_NAME}} Engineering Team,
{{_TECHNICAL_INTRO}}`,
        },
        {
          type: 'BODY',
          order: 2,
          template: `As a {{YEARS_EXPERIENCE}}-year veteran in {{TECHNICAL_DOMAIN}}, I have developed deep expertise in {{RELEVANT_TECHNOLOGIES}}. At {{COMPANY_NAME}}, I see an opportunity to apply and expand these skills:

{{_TECHNICAL_ACHIEVEMENTS}}
{{_OPEN_SOURCE_CONTRIBUTIONS}}
{{_TECHNICAL_ALIGNMENT}}`,
        },
        {
          type: 'CLOSING',
          order: 3,
          template: `I am particularly drawn to {{COMPANY_NAME}}'s technical challenges and would be excited to discuss how my technical background can contribute to your engineering efforts.

{{_TECHNICAL_NEXT_STEPS}}`,
        },
        {
          type: 'SIGNATURE',
          order: 4,
          template: `Best regards,
{{CANDIDATE_NAME}}
{{GITHUB_LINK | LINKEDIN_LINK}}
{{CONTACT_INFORMATION}}`,
        },
      ],
      variables: ['COMPANY_NAME', 'TECHNICAL_INTRO', 'YEARS_EXPERIENCE', 'TECHNICAL_DOMAIN', 'RELEVANT_TECHNOLOGIES', 'TECHNICAL_ACHIEVEMENTS', 'OPEN_SOURCE_CONTRIBUTIONS', 'TECHNICAL_ALIGNMENT', 'TECHNICAL_NEXT_STEPS', 'CANDIDATE_NAME', 'GITHUB_LINK', 'LINKEDIN_LINK', 'CONTACT_INFORMATION'],
    });
  }

  async generateCoverLetter(
    persona: Persona,
    jobPosting: JobPosting,
    options: CoverLetterGenerationOptions = {},
  ): Promise<GeneratedCoverLetter> {
    const template = this.getTemplate(options.templateId, options.tone);
    const variables = this.buildVariables(persona, jobPosting, options);
    const content = this.renderTemplate(template, variables);
    
    const keyPoints = this.identifyKeyPoints(persona, jobPosting);
    const customizationNotes = this.generateCustomizationNotes(template, variables);

    return {
      content,
      templateUsed: template.id,
      toneApplied: template.tone,
      sections: this.identifySections(content),
      keyPointsCovered: keyPoints,
      customizationNotes,
    };
  }

  getTemplate(templateId?: string, tone?: string): CoverLetterTemplate {
    if (templateId && this.templates.has(templateId)) {
      return this.templates.get(templateId)!;
    }

    // Find template by tone
    if (tone) {
      for (const template of this.templates.values()) {
        if (template.tone === tone) {
          return template;
        }
      }
    }

    // Default to professional template
    return this.templates.get('professional-standard')!;
  }

  getAllTemplates(): CoverLetterTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByTone(tone: CoverLetterTemplate['tone']): CoverLetterTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.tone === tone);
  }

  private buildVariables(
    persona: Persona,
    jobPosting: JobPosting,
    options: CoverLetterGenerationOptions,
  ): Record<string, string> {
    const jobTitle = jobPosting.title || 'Software Engineer';
    const companyName = jobPosting.company || 'your company';
    const skills = Array.isArray(persona.skills) ? persona.skills : [];
    const skillsList = skills.slice(0, 5).join(', ');
    const yearsExperience = this.calculateYearsExperience(persona);

    const variables: Record<string, string> = {
      JOB_TITLE: jobTitle,
      COMPANY_NAME: companyName,
      GREETING: this.generateGreeting(companyName),
      RELEVANT_SKILLS: skillsList,
      RELEVANT_TECHNOLOGIES: skillsList,
      YEARS_EXPERIENCE: yearsExperience,
      PERSONAL_CONNECTION: this.generatePersonalConnection(persona, companyName),
      VALUE_PROPOSITION: this.generateValueProposition(persona, jobPosting),
      RELEVANT_EXPERIENCE: this.generateRelevantExperience(persona, jobPosting),
      CALL_TO_ACTION: this.generateCallToAction(companyName),
      CANDIDATE_NAME: persona.jobTitle || 'Candidate',
      CONTACT_INFORMATION: this.generateContactInfo(),
      
      // Innovation variables
      HOOK: this.generateHook(persona, companyName),
      COMPANY_VALUES: this.inferCompanyValues(jobPosting),
      INNOVATION_EXAMPLE: this.generateInnovationExample(persona),
      ALIGNMENT_STATEMENT: this.generateAlignmentStatement(persona, companyName),
      UNIQUE_VALUE: this.generateUniqueValue(persona),
      COMPANY_GOALS: this.inferCompanyGoals(jobPosting),
      CONTRIBUTION_VISION: this.generateContributionVision(persona, jobPosting),
      NEXT_STEPS: this.generateNextSteps(companyName),
      
      // Enthusiastic variables
      EXCITEMENT_HOOK: this.generateExcitementHook(persona, jobPosting),
      PASION_PROJECT: this.generatePassionProject(persona),
      COMPANY_ADMIRATION: this.generateCompanyAdmiration(jobPosting),
      MUTUAL_BENEFIT: this.generateMutualBenefit(persona, companyName),
      CONTACT_INVITATION: this.generateContactInvitation(companyName),
      
      // Executive variables
      EXECUTIVE_SUMMARY: this.generateExecutiveSummary(persona),
      INDUSTRY: this.inferIndustry(jobPosting),
      LEADERSHIP_ACHIEVEMENTS: this.generateLeadershipAchievements(persona),
      STRATEGIC_INITIATIVES: this.generateStrategicInitiatives(persona),
      TEAM_TRANSFORMATIONS: this.generateTeamTransformations(persona),
      EXECUTIVE_ROLE_VISION: this.generateExecutiveRoleVision(persona, jobPosting),
      EXECUTIVE_NEXT_STEPS: this.generateExecutiveNextSteps(companyName),
      TITLE: this.inferTitle(persona),
      
      // Technical variables
      TECHNICAL_INTRO: this.generateTechnicalIntro(persona),
      TECHNICAL_DOMAIN: this.inferTechnicalDomain(persona, jobPosting),
      TECHNICAL_ACHIEVEMENTS: this.generateTechnicalAchievements(persona),
      OPEN_SOURCE_CONTRIBUTIONS: this.generateOpenSourceContributions(persona),
      TECHNICAL_ALIGNMENT: this.generateTechnicalAlignment(persona, jobPosting),
      TECHNICAL_NEXT_STEPS: this.generateTechnicalNextSteps(companyName),
      GITHUB_LINK: this.generateGitHubLink(persona),
      LINKEDIN_LINK: this.generateLinkedInLink(persona),
    };

    // Apply custom sections
    if (options.customSections) {
      Object.assign(variables, options.customSections);
    }

    return variables;
  }

  private renderTemplate(template: CoverLetterTemplate, variables: Record<string, string>): string {
    let content = '';
    
    // Sort sections by order
    const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);
    
    for (const section of sortedSections) {
      let sectionContent = section.template;
      
      // Replace variables
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        sectionContent = sectionContent.replace(regex, value);
      }
      
      // Remove any remaining unreplaced variables
      sectionContent = sectionContent.replace(/{{[A-Z_]+}}/g, '');
      
      content += sectionContent.trim() + '\n\n';
    }

    return content.trim();
  }

  private identifyKeyPoints(persona: Persona, jobPosting: JobPosting): string[] {
    const keyPoints: string[] = [];
    const skills = Array.isArray(persona.skills) ? persona.skills : [];

    // Add key skills mentioned
    keyPoints.push(`Proficiency in ${skills.slice(0, 3).join(', ')}`);
    
    // Add job-specific points
    if (jobPosting.requirements) {
      keyPoints.push('Meets core job requirements');
    }
    
    // Add experience-related points
    keyPoints.push(`${this.calculateYearsExperience(persona)} years of relevant experience`);
    
    // Add value proposition
    keyPoints.push('Strong cultural fit with company values');

    return keyPoints;
  }

  private generateCustomizationNotes(template: CoverLetterTemplate, variables: Record<string, string>): string[] {
    const notes: string[] = [];
    
    if (!variables['COMPANY_NAME'] || variables['COMPANY_NAME'] === 'your company') {
      notes.push('Research the company and insert the actual company name');
    }
    
    if (!variables['CANDIDATE_NAME'] || variables['CANDIDATE_NAME'] === 'Candidate') {
      notes.push('Replace with your actual name');
    }
    
    if (!variables['CONTACT_INFORMATION']) {
      notes.push('Add your contact information');
    }

    // Check for other potentially unreplaced variables
    const templateContent = template.sections.map(s => s.template).join(' ');
    const unreplacedCount = templateContent.match(/{{[A-Z_]+}}/g)?.length || 0;
    if (unreplacedCount > 0) {
      notes.push(`${unreplacedCount} variables could not be automatically filled - please review`);
    }

    return notes;
  }

  private identifySections(content: string): GeneratedSection[] {
    const sections: GeneratedSection[] = [];
    
    if (content.includes('Dear') || content.includes('Hello')) {
      sections.push({ type: 'OPENING', content: content.split(/\n\n/)[0] });
    }
    
    // Body sections
    const bodyMatch = content.match(/Dear[\s\S]*?(?=Sincerely|Best|Thank|Ready|Respectfully)/);
    if (bodyMatch) {
      sections.push({ type: 'BODY', content: bodyMatch[0] });
    }
    
    // Closing
    if (content.includes('Sincerely') || content.includes('Best regards')) {
      sections.push({ type: 'CLOSING', content: content.split(/Sincerely|Best regards|Respectfully/)[1]?.trim() || '' });
    }
    
    return sections;
  }

  // Helper methods for generating variable content
  private calculateYearsExperience(persona: Persona): string {
    // In a real implementation, this would calculate from actual experience dates
    return '5+';
  }

  private generateGreeting(companyName: string): string {
    return `I am writing to express my interest in the position at ${companyName}`;
  }

  private generatePersonalConnection(persona: Persona, companyName: string): string {
    return `My interest in ${companyName} stems from your reputation for innovation in the industry`;
  }

  private generateValueProposition(persona: Persona, jobPosting: JobPosting): string {
    const skills = Array.isArray(persona.skills) ? persona.skills : [];
    return `I bring a unique combination of ${skills.slice(0, 2).join(' and ')} expertise`;
  }

  private generateRelevantExperience(persona: Persona, jobPosting: JobPosting): string {
    return `In my current role, I have successfully delivered projects that directly align with this position's requirements`;
  }

  private generateCallToAction(companyName: string): string {
    return `I would welcome the opportunity to discuss how my skills can contribute to ${companyName}'s success`;
  }

  private generateContactInfo(): string {
    return 'Email: your.email@example.com | Phone: (555) 123-4567';
  }

  private generateHook(persona: Persona, companyName: string): string {
    return `Having followed ${companyName}'s growth journey, I'm impressed by your commitment to excellence`;
  }

  private inferCompanyValues(jobPosting: JobPosting): string {
    const desc = (jobPosting.description || '').toLowerCase();
    if (desc.includes('innovation')) return 'innovation and cutting-edge solutions';
    if (desc.includes('customer')) return 'customer-centric approach';
    if (desc.includes('teamwork')) return 'collaborative teamwork';
    return 'excellence and innovation';
  }

  private generateInnovationExample(persona: Persona): string {
    return 'I have led initiatives that transformed traditional processes into streamlined, efficient workflows';
  }

  private generateAlignmentStatement(persona: Persona, companyName: string): string {
    return `My professional values align perfectly with ${companyName}'s mission`;
  }

  private generateUniqueValue(persona: Persona): string {
    return 'My blend of technical expertise and strategic thinking sets me apart';
  }

  private inferCompanyGoals(jobPosting: JobPosting): string {
    return 'pushing the boundaries of what\'s possible';
  }

  private generateContributionVision(persona: Persona, jobPosting: JobPosting): string {
    return 'make meaningful contributions to your technical initiatives';
  }

  private generateNextSteps(companyName: string): string {
    return `I look forward to the opportunity to speak with you about how I can contribute to ${companyName}`;
  }

  private generateExcitementHook(persona: Persona, jobPosting: JobPosting): string {
    return 'I am excited to apply for this position!';
  }

  private generatePassionProject(persona: Persona): string {
    return 'Throughout my career, I have been passionate about delivering exceptional results';
  }

  private generateCompanyAdmiration(jobPosting: JobPosting): string {
    return `${jobPosting.company} has established itself as a leader in the industry`;
  }

  private generateMutualBenefit(persona: Persona, companyName: string): string {
    return `I am confident that my skills and enthusiasm would make a valuable addition to the ${companyName} team`;
  }

  private generateContactInvitation(companyName: string): string {
    return `I would love to discuss how my background aligns with ${companyName}'s goals`;
  }

  private generateExecutiveSummary(persona: Persona): string {
    return 'With a distinguished career spanning multiple industries';
  }

  private inferIndustry(jobPosting: JobPosting): string {
    return 'technology';
  }

  private generateLeadershipAchievements(persona: Persona): string {
    return 'Led teams of 20+ engineers to deliver enterprise-scale solutions';
  }

  private generateStrategicInitiatives(persona: Persona): string {
    return 'Orchestrated digital transformation initiatives resulting in 40% efficiency gains';
  }

  private generateTeamTransformations(persona: Persona): string {
    return 'Built and scaled high-performing engineering teams';
  }

  private generateExecutiveRoleVision(persona: Persona, jobPosting: JobPosting): string {
    return 'drive strategic initiatives and lead world-class teams';
  }

  private generateExecutiveNextSteps(companyName: string): string {
    return `I welcome the opportunity to discuss my vision for ${companyName}'s future`;
  }

  private inferTitle(persona: Persona): string {
    return persona.jobTitle || 'Senior Executive';
  }

  private generateTechnicalIntro(persona: Persona): string {
    const skills = Array.isArray(persona.skills) ? persona.skills : [];
    return `As a skilled ${skills[0] || 'engineer'} with a passion for building scalable solutions`;
  }

  private inferTechnicalDomain(persona: Persona, jobPosting: JobPosting): string {
    return 'software engineering';
  }

  private generateTechnicalAchievements(persona: Persona): string {
    return 'Built systems handling millions of requests daily with 99.9% uptime';
  }

  private generateOpenSourceContributions(persona: Persona): string {
    return 'Active contributor to open-source projects with 500+ GitHub stars';
  }

  private generateTechnicalAlignment(persona: Persona, jobPosting: JobPosting): string {
    return 'My technical background aligns perfectly with your stack and engineering culture';
  }

  private generateTechnicalNextSteps(companyName: string): string {
    return `Let's discuss how my technical skills can contribute to ${companyName}'s engineering team`;
  }

  private generateGitHubLink(persona: Persona): string {
    return 'github.com/yourprofile';
  }

  private generateLinkedInLink(persona: Persona): string {
    return 'linkedin.com/in/yourprofile';
  }
}
