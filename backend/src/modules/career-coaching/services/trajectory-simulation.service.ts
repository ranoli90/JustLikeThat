import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrajectorySimulation } from '../entities/career-coaching.entity';

// Industry and role data for projections
const INDUSTRY_GROWTH_RATES: Record<string, { growth: number; stability: number }> = {
  'technology': { growth: 0.15, stability: 0.8 },
  'finance': { growth: 0.08, stability: 0.9 },
  'healthcare': { growth: 0.12, stability: 0.85 },
  'retail': { growth: 0.03, stability: 0.7 },
  'manufacturing': { growth: 0.02, stability: 0.75 },
  'education': { growth: 0.05, stability: 0.8 },
  'consulting': { growth: 0.10, stability: 0.75 },
  'government': { growth: 0.01, stability: 0.95 },
};

const ROLE_SALARY_RANGES: Record<string, { entry: number; mid: number; senior: number; lead: number }> = {
  'software-engineer': { entry: 70000, mid: 120000, senior: 160000, lead: 200000 },
  'product-manager': { entry: 80000, mid: 130000, senior: 170000, lead: 220000 },
  'data-scientist': { entry: 75000, mid: 130000, senior: 180000, lead: 230000 },
  'devops-engineer': { entry: 75000, mid: 125000, senior: 165000, lead: 210000 },
  'engineering-manager': { entry: 100000, mid: 150000, senior: 200000, lead: 250000 },
  'designer': { entry: 65000, mid: 110000, senior: 150000, lead: 190000 },
  'marketing': { entry: 55000, mid: 95000, senior: 130000, lead: 170000 },
  'sales': { entry: 50000, mid: 100000, senior: 150000, lead: 200000 },
};

const PROMOTION_TIMELINES: Record<string, { yearsToMid: number; yearsToSenior: number; yearsToLead: number }> = {
  'technology': { yearsToMid: 2, yearsToSenior: 5, yearsToLead: 8 },
  'finance': { yearsToMid: 3, yearsToSenior: 6, yearsToLead: 10 },
  'healthcare': { yearsToMid: 3, yearsToSenior: 7, yearsToLead: 12 },
  'consulting': { yearsToMid: 2, yearsToSenior: 5, yearsToLead: 9 },
};

export interface SimulationInput {
  userId: string;
  currentRole: string;
  targetRole: string;
  currentSalary: number;
  experienceYears: number;
  industry: string;
  location: string;
  skills: string[];
  goals?: {
    timeline: '1-year' | '3-year' | '5-year' | '10-year';
    salaryTarget?: number;
    levelTarget?: string;
  }[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  timeline: { year: number; role: string; salary: number; milestones: string[] }[];
  risks: { factor: string; likelihood: string; mitigation: string }[];
  opportunities: { factor: string; impact: string }[];
}

export interface Projection {
  year: number;
  role: string;
  salary: number;
  growthRate: number;
  confidence: number;
}

@Injectable()
export class TrajectorySimulationService {
  private readonly logger = new Logger(TrajectorySimulationService.name);
  private readonly simulationAccuracy = 0.85;
  private readonly projectionRange = { min: 1, max: 10 };

  constructor(
    @InjectRepository(TrajectorySimulation)
    private readonly simulationRepository: Repository<TrajectorySimulation>,
  ) {}

  async simulate(input: SimulationInput): Promise<TrajectorySimulation> {
    this.logger.log(`Running trajectory simulation for user ${input.userId}`);

    // Generate multiple scenarios
    const scenarios = this.generateScenarios(input);
    
    // Calculate salary projections
    const projections = this.calculateProjections(input);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(input, scenarios, projections);

    const simulation = this.simulationRepository.create({
      userId: input.userId,
      currentRole: input.currentRole,
      targetRole: input.targetRole,
      simulations: scenarios,
      projections,
      recommendations,
    });

    const saved = await this.simulationRepository.save(simulation);
    return saved;
  }

  async getSimulation(simulationId: string): Promise<TrajectorySimulation | null> {
    return this.simulationRepository.findOne({ where: { id: simulationId } });
  }

  async compareScenarios(simulationId: string, scenarioIds: string[]): Promise<any> {
    const simulation = await this.simulationRepository.findOne({ where: { id: simulationId } });
    if (!simulation) throw new Error('Simulation not found');

    const scenarios = (simulation.simulations as Scenario[]) || [];
    const selectedScenarios = scenarios.filter(s => scenarioIds.includes(s.id));

    return {
      comparison: selectedScenarios.map(s => ({
        id: s.id,
        name: s.name,
        probability: s.probability,
        finalSalary: s.timeline[s.timeline.length - 1]?.salary,
        finalRole: s.timeline[s.timeline.length - 1]?.role,
        risks: s.risks.length,
        opportunities: s.opportunities.length,
      })),
      recommendation: this.selectBestScenario(selectedScenarios),
    };
  }

  private generateScenarios(input: SimulationInput): Scenario[] {
    const industryGrowth = INDUSTRY_GROWTH_RATES[input.industry.toLowerCase()] || INDUSTRY_GROWTH_RATES['technology'];
    const currentRoleRange = ROLE_SALARY_RANGES[input.currentRole.toLowerCase().replace(/\s+/g, '-')] || ROLE_SALARY_RANGES['software-engineer'];
    const targetRoleRange = ROLE_SALARY_RANGES[input.targetRole.toLowerCase().replace(/\s+/g, '-')] || ROLE_SALARY_RANGES['software-engineer'];

    return [
      {
        id: 'optimistic',
        name: 'Accelerated Growth',
        description: 'Aggressive career progression with rapid skill development and strategic networking',
        probability: 0.3,
        timeline: this.generateTimeline(input, 'optimistic', industryGrowth, currentRoleRange, targetRoleRange),
        risks: [
          { factor: 'Burnout', likelihood: 'High', mitigation: 'Maintain work-life balance and take regular breaks' },
          { factor: 'Market Downturn', likelihood: 'Medium', mitigation: 'Diversify skills and build emergency fund' },
        ],
        opportunities: [
          { factor: 'Tech Innovation', impact: 'High potential for rapid advancement' },
          { factor: 'Leadership Opportunity', impact: 'Early promotion to management track' },
        ],
      },
      {
        id: 'moderate',
        name: 'Steady Progression',
        description: 'Balanced approach with consistent skill building and gradual advancement',
        probability: 0.5,
        timeline: this.generateTimeline(input, 'moderate', industryGrowth, currentRoleRange, targetRoleRange),
        risks: [
          { factor: 'Skill Obsolescence', likelihood: 'Medium', mitigation: 'Continuous learning and upskilling' },
          { factor: 'Company Restructuring', likelihood: 'Low', mitigation: 'Maintain updated resume and network' },
        ],
        opportunities: [
          { factor: 'Internal Promotion', impact: 'Consistent path to senior roles' },
          { factor: 'Specialization', impact: 'Become subject matter expert' },
        ],
      },
      {
        id: 'conservative',
        name: 'Cautious Approach',
        description: 'Low-risk strategy focusing on stability and incremental improvements',
        probability: 0.2,
        timeline: this.generateTimeline(input, 'conservative', industryGrowth, currentRoleRange, targetRoleRange),
        risks: [
          { factor: 'Missed Opportunities', likelihood: 'Medium', mitigation: 'Regularly reassess career goals' },
          { factor: 'Salary Stagnation', likelihood: 'Low', mitigation: 'Periodic market salary reviews' },
        ],
        opportunities: [
          { factor: 'Job Security', impact: 'Stable position during market fluctuations' },
          { factor: 'Work-Life Balance', impact: 'Sustainable long-term career approach' },
        ],
      },
      {
        id: 'career-change',
        name: 'Career Pivot',
        description: 'Strategic transition to a different industry or role',
        probability: 0.15,
        timeline: this.generateTimeline(input, 'career-change', industryGrowth, currentRoleRange, targetRoleRange),
        risks: [
          { factor: 'Skill Gap', likelihood: 'High', mitigation: 'Comprehensive training and certifications' },
          { factor: 'Salary Reduction', likelihood: 'Medium', mitigation: 'Financial planning for transition period' },
        ],
        opportunities: [
          { factor: 'Higher Growth Industry', impact: 'Long-term higher earning potential' },
          { factor: 'Better Alignment', impact: 'Improved job satisfaction and fulfillment' },
        ],
      },
    ];
  }

  private generateTimeline(
    input: SimulationInput,
    scenario: string,
    industryGrowth: { growth: number; stability: number },
    currentRange: { entry: number; mid: number; senior: number; lead: number },
    targetRange: { entry: number; mid: number; senior: number; lead: number }
  ): { year: number; role: string; salary: number; milestones: string[] }[] {
    const timeline = [];
    const years = scenario === 'optimistic' ? 5 : scenario === 'moderate' ? 7 : 10;
    
    const multipliers = {
      'optimistic': 1.5,
      'moderate': 1.0,
      'conservative': 0.7,
      'career-change': 0.8,
    };

    const multiplier = multipliers[scenario];
    let currentSalary = input.currentSalary;
    let currentRole = input.currentRole;

    for (let year = 0; year <= years; year++) {
      const milestoneProgress = Math.min(year / years, 1);
      const role = year < 2 ? currentRole : input.targetRole;
      
      // Calculate salary based on industry growth, scenario, and role
      const baseSalary = year < 2 ? currentRange.mid : targetRange.entry + (targetRange.lead - targetRange.entry) * milestoneProgress;
      const growthAmount = currentSalary * industryGrowth.growth * multiplier;
      currentSalary = Math.round(baseSalary + growthAmount * year);

      const milestones = this.getYearMilestones(year, role, scenario);

      timeline.push({
        year,
        role,
        salary: currentSalary,
        milestones,
      });
    }

    return timeline;
  }

  private getYearMilestones(year: number, role: string, scenario: string): string[] {
    const milestonesByYear: Record<number, string[]> = {
      0: ['Current position established'],
      1: ['Complete professional development plan', 'Build key relationships'],
      2: ['Consider certifications', 'Take on leadership responsibilities'],
      3: ['Mid-level role achieved', 'Mentor junior team members'],
      4: ['Advanced skills mastered', 'Contribute to strategic initiatives'],
      5: ['Senior position achieved', 'Lead significant projects'],
      6: ['Industry recognition', 'Expand professional network'],
      7: ['Thought leadership', 'Drive innovation'],
      8: ['Leadership opportunity', 'Executive visibility'],
      9: ['Strategic impact', 'Organization-level influence'],
      10: ['Career mastery achieved', 'Give back through mentorship'],
    };

    return milestonesByYear[year] || ['Continue professional growth'];
  }

  private calculateProjections(input: SimulationInput): Projection[] {
    const projections: Projection[] = [];
    const industryGrowth = INDUSTRY_GROWTH_RATES[input.industry.toLowerCase()] || INDUSTRY_GROWTH_RATES['technology'];
    const roleRange = ROLE_SALARY_RANGES[input.targetRole.toLowerCase().replace(/\s+/g, '-')] || ROLE_SALARY_RANGES['software-engineer'];

    for (let year = 1; year <= 10; year++) {
      // Calculate realistic growth based on industry and role
      const baseGrowth = industryGrowth.growth;
      const experienceMultiplier = Math.min(1 + (input.experienceYears + year) * 0.02, 2);
      const salaryGrowthRate = baseGrowth * experienceMultiplier;

      const baseSalary = roleRange.entry + (roleRange.lead - roleRange.entry) * (year / 10);
      const projectedSalary = Math.round(input.currentSalary * Math.pow(1 + salaryGrowthRate, year));
      
      // Adjust confidence based on projection distance
      const confidence = Math.max(0.5, this.simulationAccuracy - (year * 0.05));

      projections.push({
        year,
        role: year < 3 ? input.targetRole : `Senior ${input.targetRole}`,
        salary: projectedSalary,
        growthRate: salaryGrowthRate,
        confidence,
      });
    }

    return projections;
  }

  private generateRecommendations(
    input: SimulationInput,
    scenarios: Scenario[],
    projections: Projection[]
  ): any[] {
    return [
      {
        category: 'Skills Development',
        priority: 10,
        recommendation: `Focus on acquiring ${input.targetRole}-specific skills within the next 6-12 months`,
        impact: 'High',
        effort: 'Medium',
      },
      {
        category: 'Networking',
        priority: 8,
        recommendation: 'Build relationships with professionals in your target industry',
        impact: 'High',
        effort: 'Low',
      },
      {
        category: 'Certification',
        priority: 7,
        recommendation: 'Obtain relevant certifications to validate your expertise',
        impact: 'Medium',
        effort: 'High',
      },
      {
        category: 'Experience Building',
        priority: 9,
        recommendation: 'Seek projects or opportunities that provide relevant experience',
        impact: 'High',
        effort: 'High',
      },
      {
        category: 'Salary Negotiation',
        priority: 6,
        recommendation: 'Research market rates and prepare negotiation strategies',
        impact: 'Medium',
        effort: 'Low',
      },
      {
        category: 'Personal Branding',
        priority: 7,
        recommendation: 'Build an online presence through content and thought leadership',
        impact: 'Medium',
        effort: 'Medium',
      },
      {
        category: 'Mentorship',
        priority: 8,
        recommendation: 'Find mentors who have successfully made similar transitions',
        impact: 'High',
        effort: 'Low',
      },
      {
        category: 'Financial Planning',
        priority: 5,
        recommendation: 'Plan finances to accommodate potential career transition costs',
        impact: 'Medium',
        effort: 'Low',
      },
    ];
  }

  private selectBestScenario(scenarios: Scenario[]): any {
    if (scenarios.length === 0) return null;

    // Score each scenario based on probability and opportunity/risk ratio
    const scoredScenarios = scenarios.map(s => ({
      ...s,
      score: s.probability * 100 + (s.opportunities.length * 10) - (s.risks.length * 5),
    }));

    const best = scoredScenarios.sort((a, b) => b.score - a.score)[0];

    return {
      recommended: best.name,
      reason: `This scenario offers the best balance of probability (${best.probability * 100}%) with manageable risks and significant opportunities.`,
      alternative: scoredScenarios[1]?.name,
    };
  }
}
