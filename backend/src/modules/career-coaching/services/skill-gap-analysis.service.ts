import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkillAssessment } from '../entities/career-coaching.entity';

// Skills database with categories, levels, and related skills
const SKILLS_DATABASE = {
  'programming-languages': [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'C#'
  ],
  'frontend': [
    'React', 'Vue.js', 'Angular', 'HTML5', 'CSS3', 'SASS', 'Tailwind CSS', 'Web Components', 'Next.js', 'Nuxt.js'
  ],
  'backend': [
    'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'Spring Boot', 'FastAPI', 'Rails', 'ASP.NET Core'
  ],
  'databases': [
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra', 'Firebase'
  ],
  'cloud': [
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Serverless', 'CloudFormation'
  ],
  'devops': [
    'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Ansible', 'Puppet', 'Linux', 'Bash Scripting'
  ],
  'soft-skills': [
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Critical Thinking',
    'Adaptability', 'Conflict Resolution', 'Mentoring', 'Negotiation', 'Presentation', 'Written Communication'
  ],
  'data': [
    'SQL', 'Data Analysis', 'Machine Learning', 'Deep Learning', 'Statistics', 'Data Visualization',
    'Tableau', 'Power BI', 'Apache Spark', 'Hadoop', 'NLP', 'Computer Vision'
  ],
  'security': [
    'Cybersecurity', 'Penetration Testing', 'Security Auditing', 'Compliance', 'OAuth', 'SSL/TLS', 'WAF', 'SIEM'
  ],
  'project-management': [
    'Agile', 'Scrum', 'Kanban', 'JIRA', 'Risk Management', 'Stakeholder Management', 'Budgeting', 'Resource Planning'
  ],
  'leadership': [
    'Strategic Planning', 'Team Building', 'Decision Making', 'Change Management', 'Organizational Development',
    'Performance Management', 'Talent Acquisition', 'Culture Building', 'Executive Presence'
  ]
};

// Role skill mappings
const ROLE_SKILL_MAPPINGS: Record<string, { required: string[]; preferred: string[]; level: string }> = {
  'software-engineer': {
    required: ['JavaScript', 'HTML5', 'CSS3', 'Git', 'REST APIs', 'Problem Solving'],
    preferred: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    level: 'intermediate'
  },
  'senior-software-engineer': {
    required: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'System Design', 'Mentoring'],
    preferred: ['AWS', 'Kubernetes', 'GraphQL', 'PostgreSQL', 'Redis'],
    level: 'advanced'
  },
  'engineering-manager': {
    required: ['Leadership', 'Team Building', 'Project Management', 'Communication', 'Strategic Planning'],
    preferred: ['Agile', 'Scrum', 'JIRA', 'Budgeting', 'Stakeholder Management'],
    level: 'expert'
  },
  'product-manager': {
    required: ['Product Strategy', 'User Research', 'Data Analysis', 'Communication', 'Roadmapping'],
    preferred: ['SQL', 'JIRA', 'A/B Testing', 'Market Research', 'Agile'],
    level: 'intermediate'
  },
  'data-scientist': {
    required: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Data Visualization'],
    preferred: ['TensorFlow', 'PyTorch', 'Spark', 'Deep Learning', 'NLP'],
    level: 'advanced'
  },
  'devops-engineer': {
    required: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Python'],
    preferred: ['Terraform', 'Ansible', 'Jenkins', 'Prometheus', 'Grafana'],
    level: 'advanced'
  },
  'frontend-developer': {
    required: ['JavaScript', 'React', 'HTML5', 'CSS3', 'Git'],
    preferred: ['TypeScript', 'Next.js', 'Tailwind CSS', 'Jest', 'Webpack'],
    level: 'intermediate'
  },
  'backend-developer': {
    required: ['Node.js', 'Python', 'REST APIs', 'SQL', 'Git'],
    preferred: ['Docker', 'AWS', 'PostgreSQL', 'Redis', 'Microservices'],
    level: 'intermediate'
  },
  'full-stack-developer': {
    required: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs'],
    preferred: ['TypeScript', 'AWS', 'Docker', 'MongoDB', 'GraphQL'],
    level: 'advanced'
  },
  'tech-lead': {
    required: ['System Design', 'Leadership', 'Code Review', 'Architecture', 'Mentoring'],
    preferred: ['AWS', 'Kubernetes', 'Event-Driven Architecture', 'Performance Optimization'],
    level: 'expert'
  }
};

export interface SkillInput {
  userId: string;
  currentSkills: { skill: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; years: number }[];
  targetRole: string;
  industry?: string;
  experienceYears?: number;
}

export interface GapAnalysisResult {
  gaps: { skill: string; priority: number; category: string; resources: string[] }[];
  strengths: { skill: string; level: string; matchScore: number }[];
  recommendations: { title: string; description: string; priority: number; estimatedTime: string }[];
  confidence: number;
  overallMatchScore: number;
}

@Injectable()
export class SkillGapAnalysisService {
  private readonly logger = new Logger(SkillGapAnalysisService.name);
  private readonly skillsDatabaseSize = 50000;

  constructor(
    @InjectRepository(SkillAssessment)
    private readonly skillAssessmentRepository: Repository<SkillAssessment>,
  ) {}

  async analyze(input: SkillInput): Promise<GapAnalysisResult> {
    this.logger.log(`Analyzing skill gaps for user ${input.userId} targeting ${input.targetRole}`);

    const roleRequirements = ROLE_SKILL_MAPPINGS[input.targetRole.toLowerCase().replace(/\s+/g, '-')];
    
    if (!roleRequirements) {
      return this.createGenericAnalysis(input);
    }

    // Identify gaps
    const gaps = this.identifyGaps(input.currentSkills, roleRequirements);
    
    // Analyze strengths
    const strengths = this.analyzeStrengths(input.currentSkills, roleRequirements);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(gaps, input.targetRole);
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(input.currentSkills, roleRequirements);
    const overallMatchScore = this.calculateMatchScore(strengths, gaps);

    const result: GapAnalysisResult = {
      gaps,
      strengths,
      recommendations,
      confidence,
      overallMatchScore,
    };

    // Save assessment
    await this.saveAssessment(input, result);

    return result;
  }

  async getAssessment(assessmentId: string): Promise<SkillAssessment | null> {
    return this.skillAssessmentRepository.findOne({ where: { id: assessmentId } });
  }

  async getRecommendations(assessmentId: string): Promise<any> {
    const assessment = await this.skillAssessmentRepository.findOne({ where: { id: assessmentId } });
    if (!assessment) throw new Error('Assessment not found');
    return assessment.recommendations;
  }

  private identifyGaps(
    currentSkills: { skill: string; level: string; years: number }[],
    roleRequirements: { required: string[]; preferred: string[]; level: string }
  ): { skill: string; priority: number; category: string; resources: string[] }[] {
    const currentSkillNames = currentSkills.map(s => s.skill.toLowerCase());
    const gaps: { skill: string; priority: number; category: string; resources: string[] }[] = [];

    // Check required skills
    roleRequirements.required.forEach(requiredSkill => {
      const existingSkill = currentSkills.find(
        s => s.skill.toLowerCase() === requiredSkill.toLowerCase()
      );

      if (!existingSkill) {
        gaps.push({
          skill: requiredSkill,
          priority: 10,
          category: this.getSkillCategory(requiredSkill),
          resources: this.getResourcesForSkill(requiredSkill),
        });
      } else if (this.getLevelPriority(existingSkill.level) < this.getLevelPriority(roleRequirements.level)) {
        gaps.push({
          skill: existingSkill.skill,
          priority: 8,
          category: this.getSkillCategory(existingSkill.skill),
          resources: this.getResourcesForSkill(existingSkill.skill),
        });
      }
    });

    // Check preferred skills
    roleRequirements.preferred.forEach(preferredSkill => {
      if (!currentSkillNames.includes(preferredSkill.toLowerCase())) {
        gaps.push({
          skill: preferredSkill,
          priority: 5,
          category: this.getSkillCategory(preferredSkill),
          resources: this.getResourcesForSkill(preferredSkill),
        });
      }
    });

    // Sort by priority and return top gaps
    return gaps.sort((a, b) => b.priority - a.priority).slice(0, 15);
  }

  private analyzeStrengths(
    currentSkills: { skill: string; level: string; years: number }[],
    roleRequirements: { required: string[]; preferred: string[]; level: string }
  ): { skill: string; level: string; matchScore: number }[] {
    return currentSkills.map(skill => {
      const isRequired = roleRequirements.required.some(
        r => r.toLowerCase() === skill.skill.toLowerCase()
      );
      const isPreferred = roleRequirements.preferred.some(
        p => p.toLowerCase() === skill.skill.toLowerCase()
      );

      let matchScore = 0;
      if (isRequired) matchScore = 100;
      else if (isPreferred) matchScore = 70;
      else matchScore = 30;

      return {
        skill: skill.skill,
        level: skill.level,
        matchScore,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  private generateRecommendations(
    gaps: { skill: string; priority: number; category: string }[],
    targetRole: string
  ): { title: string; description: string; priority: number; estimatedTime: string }[] {
    const recommendations: { title: string; description: string; priority: number; estimatedTime: string }[] = [];

    // Priority 1: Critical skill gaps
    const criticalGaps = gaps.filter(g => g.priority >= 8);
    if (criticalGaps.length > 0) {
      recommendations.push({
        title: 'Address Critical Skill Gaps',
        description: `Focus on learning ${criticalGaps.slice(0, 3).map(g => g.skill).join(', ')} which are essential for ${targetRole} positions.`,
        priority: 10,
        estimatedTime: `${criticalGaps.length * 3} months`,
      });
    }

    // Priority 2: Certification recommendations
    recommendations.push({
      title: 'Get Industry Certifications',
      description: 'Consider AWS Solutions Architect, Google Cloud Professional, or relevant certifications for your target role.',
      priority: 8,
      estimatedTime: '3-6 months',
    });

    // Priority 3: Hands-on experience
    if (gaps.length > 0) {
      recommendations.push({
        title: 'Build Practical Projects',
        description: `Create ${gaps[0]?.skill || 'related'} projects to demonstrate your skills to potential employers.`,
        priority: 7,
        estimatedTime: '2-4 months',
      });
    }

    // Priority 4: Soft skills development
    recommendations.push({
      title: 'Develop Soft Skills',
      description: 'Focus on communication, leadership, and teamwork skills that are valued across all roles.',
      priority: 6,
      estimatedTime: 'Ongoing',
    });

    // Priority 5: Networking
    recommendations.push({
      title: 'Build Industry Network',
      description: 'Connect with professionals in your target field through LinkedIn and industry events.',
      priority: 5,
      estimatedTime: 'Ongoing',
    });

    // Priority 6: Continuous learning
    recommendations.push({
      title: 'Establish Learning Habit',
      description: 'Dedicate at least 5 hours per week to learning new skills and staying updated with industry trends.',
      priority: 4,
      estimatedTime: 'Ongoing',
    });

    return recommendations;
  }

  private calculateConfidence(
    currentSkills: { skill: string; level: string; years: number }[],
    roleRequirements: { required: string[]; preferred: string[]; level: string }
  ): number {
    // Base confidence on completeness of skill data
    const requiredCount = roleRequirements.required.length;
    const providedCount = currentSkills.length;
    const coverageRatio = Math.min(providedCount / requiredCount, 1.5);
    
    // Confidence increases with more detailed skill information
    const detailScore = currentSkills.every(s => s.years && s.level) ? 1 : 0.7;
    
    return Math.min(0.95, coverageRatio * detailScore * 0.9 + 0.1);
  }

  private calculateMatchScore(
    strengths: { skill: string; level: string; matchScore: number }[],
    gaps: { skill: string; priority: number; category: string }[]
  ): number {
    if (strengths.length === 0) return 0;

    const totalMatchScore = strengths.reduce((sum, s) => sum + s.matchScore, 0);
    const gapPenalty = gaps.filter(g => g.priority >= 8).length * 10;
    
    const score = (totalMatchScore / strengths.length) - gapPenalty;
    return Math.max(0, Math.min(100, score));
  }

  private createGenericAnalysis(input: SkillInput): GapAnalysisResult {
    return {
      gaps: input.currentSkills.map(s => ({
        skill: `General ${s.skill} skills`,
        priority: 5,
        category: 'general',
        resources: ['Online courses', 'Documentation', 'Practice projects'],
      })),
      strengths: input.currentSkills.map(s => ({
        skill: s.skill,
        level: s.level,
        matchScore: 50,
      })),
      recommendations: [
        {
          title: 'Research Target Role',
          description: 'Look up specific requirements for your target position.',
          priority: 10,
          estimatedTime: '1 week',
        },
        {
          title: 'Update Skills Inventory',
          description: 'Add more details about your skill levels and experience.',
          priority: 9,
          estimatedTime: 'Ongoing',
        },
      ],
      confidence: 0.5,
      overallMatchScore: 50,
    };
  }

  private getSkillCategory(skill: string): string {
    for (const [category, skills] of Object.entries(SKILLS_DATABASE)) {
      if (skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        return category;
      }
    }
    return 'other';
  }

  private getResourcesForSkill(skill: string): string[] {
    const resources: Record<string, string[]> = {
      'React': ['React Documentation', 'Frontend Masters', 'Egghead.io'],
      'Node.js': ['Node.js Documentation', 'Node School', 'Udemy Node.js Course'],
      'Python': ['Python Documentation', 'Real Python', 'Coursera Python'],
      'AWS': ['AWS Training', 'A Cloud Guru', 'AWS Documentation'],
      'Leadership': ['Leadership Books', 'Management Courses', 'Mentorship'],
      'SQL': ['SQLZoo', 'Mode Analytics', 'W3Schools SQL'],
      'Machine Learning': ['Coursera ML', 'fast.ai', 'TensorFlow Documentation'],
      'Docker': ['Docker Documentation', 'Docker Playground', 'Kube Academy'],
      'Kubernetes': ['Kubernetes Documentation', 'Kube Academy', 'Katacoda'],
    };

    return resources[skill] || [
      'Official Documentation',
      'Online Courses',
      'Practice Projects',
      'Community Forums',
    ];
  }

  private getLevelPriority(level: string): number {
    const priorities: Record<string, number> = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4,
    };
    return priorities[level.toLowerCase()] || 2;
  }

  private async saveAssessment(input: SkillInput, result: GapAnalysisResult): Promise<void> {
    const assessment = this.skillAssessmentRepository.create({
      userId: input.userId,
      assessedSkills: input.currentSkills,
      targetRole: input.targetRole,
      gapAnalysis: result,
      recommendations: result.recommendations,
      confidence: result.confidence,
    });

    await this.skillAssessmentRepository.save(assessment);
  }
}
