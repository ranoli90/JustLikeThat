import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CareerPath, PathType, CareerLevel } from '../../entities/career-path.entity';
import { SkillGap, SkillCategory, SkillLevel } from '../../entities/skill-gap.entity';
import { CareerMilestone, MilestoneType, MilestoneStatus, MilestoneTemplate } from '../../entities/career-milestone.entity';
import { CareerGoal, GoalTimeframe, GoalStatus, GoalPriority } from '../../entities/career-goal.entity';
import { Certification, CertificationStatus, CertificationTemplate } from '../../entities/certification.entity';
import { LearningResource, ResourceType, ResourceStatus } from '../../entities/learning-resource.entity';
import { MentorshipRelationship, MentorshipStatus, MentorProfile } from '../../entities/mentorship.entity';
import { SalaryProjection, SalaryTimeframe, SalaryHistory } from '../../entities/salary-projection.entity';
import { IndustryTrend, TrendType, TrendDirection, SkillPrediction } from '../../entities/industry-trend.entity';

export interface CareerAnalysisResult {
  currentLevel: CareerLevel;
  targetLevel: CareerLevel;
  skillGaps: SkillGap[];
  recommendedPath: CareerPath;
  estimatedTimeline: number;
  requiredSkills: string[];
  preferredSkills: string[];
  certifications: Certification[];
  learningResources: LearningResource[];
}

export interface SkillGapAnalysisResult {
  gaps: SkillGap[];
  priorityOrder: number[];
  estimatedTimeToClose: number;
  recommendedResources: LearningResource[];
  milestones: CareerMilestone[];
}

@Injectable()
export class CareerService {
  constructor(
    @InjectRepository(CareerPath)
    private readonly careerPathRepository: Repository<CareerPath>,
    @InjectRepository(SkillGap)
    private readonly skillGapRepository: Repository<SkillGap>,
    @InjectRepository(CareerMilestone)
    private readonly milestoneRepository: Repository<CareerMilestone>,
    @InjectRepository(MilestoneTemplate)
    private readonly milestoneTemplateRepository: Repository<MilestoneTemplate>,
    @InjectRepository(CareerGoal)
    private readonly goalRepository: Repository<CareerGoal>,
    @InjectRepository(Certification)
    private readonly certificationRepository: Repository<Certification>,
    @InjectRepository(CertificationTemplate)
    private readonly certificationTemplateRepository: Repository<CertificationTemplate>,
    @InjectRepository(LearningResource)
    private readonly learningResourceRepository: Repository<LearningResource>,
    @InjectRepository(LearningResourceTemplate)
    private readonly learningResourceTemplateRepository: Repository<LearningResourceTemplate>,
    @InjectRepository(MentorshipRelationship)
    private readonly mentorshipRepository: Repository<MentorshipRelationship>,
    @InjectRepository(MentorProfile)
    private readonly mentorProfileRepository: Repository<MentorProfile>,
    @InjectRepository(SalaryProjection)
    private readonly salaryProjectionRepository: Repository<SalaryProjection>,
    @InjectRepository(SalaryHistory)
    private readonly salaryHistoryRepository: Repository<SalaryHistory>,
    @InjectRepository(IndustryTrend)
    private readonly trendRepository: Repository<IndustryTrend>,
    @InjectRepository(SkillPrediction)
    private readonly predictionRepository: Repository<SkillPrediction>,
  ) {}

  // ========== Career Path Methods ==========

  async createCareerPath(userId: string, data: Partial<CareerPath>): Promise<CareerPath> {
    const path = this.careerPathRepository.create({
      userId,
      ...data,
      isActive: true,
      progressPercentage: 0,
    });
    return this.careerPathRepository.save(path);
  }

  async getCareerPaths(userId: string): Promise<CareerPath[]> {
    return this.careerPathRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getCareerPath(pathId: string): Promise<CareerPath> {
    const path = await this.careerPathRepository.findOne({ where: { id: pathId } });
    if (!path) {
      throw new NotFoundException('Career path not found');
    }
    return path;
  }

  async updateCareerPath(pathId: string, data: Partial<CareerPath>): Promise<CareerPath> {
    await this.getCareerPath(pathId);
    await this.careerPathRepository.update(pathId, data);
    return this.getCareerPath(pathId);
  }

  async generateCareerRecommendations(
    userId: string,
    currentRole: string,
    targetRole: string,
    industry: string,
  ): Promise<CareerPath[]> {
    const recommendations: CareerPath[] = [];

    // Vertical promotion path
    const verticalPath = await this.createCareerPath(userId, {
      title: `Advance from ${currentRole} to ${targetRole}`,
      pathType: PathType.VERTICAL,
      currentRole,
      targetRole,
      industry,
      targetLevel: this.getLevelFromRole(targetRole),
      estimatedTimelineMonths: this.estimateTimeline(currentRole, targetRole),
    });
    recommendations.push(verticalPath);

    // Lateral move options
    const lateralPaths = await this.getLateralPaths(userId, currentRole, industry);
    recommendations.push(...lateralPaths);

    // Career pivot option
    const pivotPath = await this.createCareerPath(userId, {
      title: `Pivot from ${currentRole} to related field`,
      pathType: 'pivot' as PathType,
      currentRole,
      industry,
      targetLevel: CareerLevel.MID,
      estimatedTimelineMonths: 24,
    });
    recommendations.push(pivotPath);

    return recommendations;
  }

  private getLevelFromRole(role: string): CareerLevel {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('junior') || roleLower.includes('associate')) return CareerLevel.JUNIOR;
    if (roleLower.includes('senior')) return CareerLevel.SENIOR;
    if (roleLower.includes('lead') || roleLower.includes('principal')) return CareerLevel.LEAD;
    if (roleLower.includes('manager')) return CareerLevel.MANAGER;
    if (roleLower.includes('director')) return CareerLevel.DIRECTOR;
    if (roleLower.includes('vp') || roleLower.includes('vice president')) return CareerLevel.VP;
    if (roleLower.includes('chief') || roleLower.includes('c-level')) return CareerLevel.C_LEVEL;
    return CareerLevel.MID;
  }

  private getLateralPaths(userId: string, currentRole: string, industry: string): Promise<CareerPath[]> {
    const lateralRoles = this.getRelatedRoles(currentRole);
    return Promise.all(
      lateralRoles.map(role =>
        this.createCareerPath(userId, {
          title: `Lateral move to ${role}`,
          pathType: PathType.LATERAL,
          currentRole,
          targetRole: role,
          industry,
          targetLevel: CareerLevel.MID,
          estimatedTimelineMonths: 6,
        })
      )
    );
  }

  private getRelatedRoles(role: string): string[] {
    const roleRelations: Record<string, string[]> = {
      'software engineer': ['product manager', 'data engineer', ' DevOps engineer', 'solution architect'],
      'product manager': ['program manager', 'product owner', 'business analyst', 'marketing manager'],
      'data scientist': ['ML engineer', 'data analyst', 'research scientist', 'BI analyst'],
      'designer': ['UX researcher', 'product designer', 'creative director', 'design lead'],
    };
    return roleRelations[role.toLowerCase()] || ['project manager', 'business analyst'];
  }

  private estimateTimeline(fromRole: string, toRole: string): number {
    const levels = Object.values(CareerLevel);
    const fromIndex = levels.indexOf(this.getLevelFromRole(fromRole));
    const toIndex = levels.indexOf(this.getLevelFromRole(toRole));
    const steps = Math.abs(toIndex - fromIndex);
    return steps * 12 + 6; // 6 months per level step
  }

  // ========== Skill Gap Analysis Methods ==========

  async analyzeSkillGaps(userId: string, targetRole: string, industry: string): Promise<SkillGapAnalysisResult> {
    const requiredSkills = this.getRequiredSkillsForRole(targetRole);
    const currentSkills = await this.getUserSkills(userId);

    const gaps: SkillGap[] = [];
    let priorityOrder = 0;

    for (const skill of requiredSkills) {
      const currentLevel = currentSkills[skill] || SkillLevel.BEGINNER;
      const requiredLevel = this.getRequiredLevelForSkill(skill, targetRole);
      const gapScore = this.calculateGapScore(currentLevel, requiredLevel);

      const gap = await this.skillGapRepository.save({
        userId,
        skillName: skill,
        category: this.getSkillCategory(skill),
        currentLevel,
        requiredLevel,
        gapScore,
        relatedRole: targetRole,
        industry,
        priorityOrder: priorityOrder++,
        isPriority: gapScore > 50,
      });
      gaps.push(gap);
    }

    const recommendedResources = await this.recommendResourcesForGaps(gaps);

    const milestones = await this.generateMilestonesFromGaps(userId, gaps);

    return {
      gaps,
      priorityOrder: gaps.map(g => g.priorityOrder),
      estimatedTimeToClose: this.estimateTimeToCloseGaps(gaps),
      recommendedResources,
      milestones,
    };
  }

  private async getUserSkills(userId: string): Promise<Record<string, SkillLevel>> {
    const skillGaps = await this.skillGapRepository.find({ where: { userId } });
    const skills: Record<string, SkillLevel> = {};
    for (const gap of skillGaps) {
      skills[gap.skillName] = gap.currentLevel;
    }
    return skills;
  }

  private getRequiredSkillsForRole(role: string): string[] {
    const roleSkills: Record<string, string[]> = {
      'software engineer': ['javascript', 'typescript', 'react', 'node.js', 'sql', 'git', 'system design'],
      'product manager': ['product strategy', 'data analysis', 'stakeholder management', 'roadmapping', 'agile'],
      'data scientist': ['python', 'machine learning', 'statistics', 'sql', 'deep learning', 'data visualization'],
      'designer': ['figma', 'user research', 'prototyping', 'design systems', 'visual design'],
    };
    return roleSkills[role.toLowerCase()] || ['communication', 'problem solving', 'project management'];
  }

  private getRequiredLevelForSkill(skill: string, role: string): SkillLevel {
    const advancedSkills = ['system design', 'machine learning', 'data architecture'];
    return advancedSkills.includes(skill.toLowerCase()) ? SkillLevel.ADVANCED : SkillLevel.INTERMEDIATE;
  }

  private getSkillCategory(skill: string): SkillCategory {
    const technicalSkills = ['javascript', 'python', 'sql', 'react', 'machine learning'];
    const leadershipSkills = ['stakeholder management', 'roadmapping', 'strategy'];
    if (technicalSkills.includes(skill.toLowerCase())) return SkillCategory.TECHNICAL;
    if (leadershipSkills.includes(skill.toLowerCase())) return SkillCategory.LEADERSHIP;
    return SkillCategory.SOFT;
  }

  private calculateGapScore(current: SkillLevel, required: SkillLevel): number {
    const levels = [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED, SkillLevel.EXPERT];
    const currentIndex = levels.indexOf(current);
    const requiredIndex = levels.indexOf(required);
    return Math.max(0, (requiredIndex - currentIndex) * 33);
  }

  private async recommendResourcesForGaps(gaps: SkillGap[]): Promise<LearningResource[]> {
    const resources: LearningResource[] = [];
    const existingTemplates = await this.learningResourceTemplateRepository.find({
      where: { isActive: true },
    });

    for (const gap of gaps.slice(0, 5)) {
      const matchingTemplates = existingTemplates.filter(t =>
        t.skills?.some(s => s.toLowerCase().includes(gap.skillName.toLowerCase()))
      );

      for (const template of matchingTemplates.slice(0, 2)) {
        const resource = await this.learningResourceRepository.save({
          userId: gap.userId,
          title: template.title,
          type: template.type,
          provider: template.provider,
          url: template.url,
          description: template.description,
          estimatedHours: template.estimatedHours,
          difficulty: template.difficulty,
          skills: template.skills,
          category: template.category,
          cost: template.cost,
          isFree: template.isFree,
          status: ResourceStatus.NOT_STARTED,
          relatedSkillGaps: [gap.id],
        });
        resources.push(resource);
      }
    }

    return resources;
  }

  private async generateMilestonesFromGaps(userId: string, gaps: SkillGap[]): Promise<CareerMilestone[]> {
    const milestones: CareerMilestone[] = [];

    for (const gap of gaps.slice(0, 5)) {
      const milestone = await this.milestoneRepository.save({
        userId,
        title: `Master ${gap.skillName}`,
        description: `Achieve ${gap.requiredLevel} level in ${gap.skillName}`,
        type: MilestoneType.SKILL_MASTERY,
        status: MilestoneStatus.PENDING,
        targetDate: this.addMonths(new Date(), 3),
        relatedSkill: gap.skillName,
        progressPercentage: 0,
      });
      milestones.push(milestone);
    }

    return milestones;
  }

  private estimateTimeToCloseGaps(gaps: SkillGap[]): number {
    const priorityGaps = gaps.filter(g => g.isPriority);
    const totalHours = priorityGaps.reduce((sum, g) => sum + (g.estimatedHoursToMaster || 100), 0);
    return Math.ceil(totalHours / 10); // Assuming 10 hours per week
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  // ========== Learning Resources Methods ==========

  async addLearningResource(userId: string, data: Partial<LearningResource>): Promise<LearningResource> {
    const resource = this.learningResourceRepository.create({
      userId,
      ...data,
      status: ResourceStatus.NOT_STARTED,
      hoursCompleted: 0,
    });
    return this.learningResourceRepository.save(resource);
  }

  async getLearningResources(userId: string, status?: ResourceStatus): Promise<LearningResource[]> {
    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;
    return this.learningResourceRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async updateLearningResource(resourceId: string, data: Partial<LearningResource>): Promise<LearningResource> {
    const resource = await this.learningResourceRepository.findOne({ where: { id: resourceId } });
    if (!resource) {
      throw new NotFoundException('Learning resource not found');
    }
    Object.assign(resource, data);
    return this.learningResourceRepository.save(resource);
  }

  async getPersonalizedRecommendations(userId: string): Promise<LearningResource[]> {
    const skillGaps = await this.skillGapRepository.find({
      where: { userId, isPriority: true },
      order: { priorityOrder: 'ASC' },
      take: 10,
    });

    const resources = await this.recommendResourcesForGaps(skillGaps);
    return resources;
  }

  // ========== Certification Methods ==========

  async addCertification(userId: string, data: Partial<Certification>): Promise<Certification> {
    const certification = this.certificationRepository.create({
      userId,
      ...data,
      status: CertificationStatus.PLANNED,
    });
    return this.certificationRepository.save(certification);
  }

  async getCertifications(userId: string): Promise<Certification[]> {
    return this.certificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCertificationTemplates(category?: string): Promise<CertificationTemplate[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    return this.certificationTemplateRepository.find({ where });
  }

  async recommendCertifications(userId: string, targetRole: string): Promise<CertificationTemplate[]> {
    const roleCertifications = this.getCertificationsForRole(targetRole);
    return this.certificationTemplateRepository.find({
      where: { name: In(roleCertifications), isActive: true },
    });
  }

  private getCertificationsForRole(role: string): string[] {
    const roleCerts: Record<string, string[]> = {
      'software engineer': ['AWS Solutions Architect', 'Google Cloud Professional', 'Kubernetes Administrator'],
      'product manager': ['Certified Scrum Product Owner', 'Pragmatic Institute Certified'],
      'data scientist': ['Google Data Engineer', 'AWS Machine Learning', 'TensorFlow Developer'],
      'project manager': ['PMP', 'CSM', 'PRINCE2'],
    };
    return roleCerts[role.toLowerCase()] || ['Professional Skills Certification'];
  }

  // ========== Milestone Methods ==========

  async createMilestone(userId: string, data: Partial<CareerMilestone>): Promise<CareerMilestone> {
    const milestone = this.milestoneRepository.create({
      userId,
      ...data,
      status: MilestoneStatus.PENDING,
      progressPercentage: 0,
    });
    return this.milestoneRepository.save(milestone);
  }

  async getMilestones(userId: string): Promise<CareerMilestone[]> {
    return this.milestoneRepository.find({
      where: { userId },
      order: { targetDate: 'ASC' },
    });
  }

  async updateMilestone(milestoneId: string, data: Partial<CareerMilestone>): Promise<CareerMilestone> {
    const milestone = await this.milestoneRepository.findOne({ where: { id: milestoneId } });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    Object.assign(milestone, data);
    return this.milestoneRepository.save(milestone);
  }

  async getMilestoneTemplates(industry?: string): Promise<MilestoneTemplate[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (industry) where.industry = industry;
    return this.milestoneTemplateRepository.find({ where, order: { order: 'ASC' } });
  }

  // ========== Mentorship Methods ==========

  async createMentorshipRelationship(userId: string, data: Partial<MentorshipRelationship>): Promise<MentorshipRelationship> {
    const relationship = this.mentorshipRepository.create({
      userId,
      ...data,
      status: MentorshipStatus.PENDING,
      matchStatus: 'suggested' as any,
      meetingsCompleted: 0,
    });
    return this.mentorshipRepository.save(relationship);
  }

  async getMentorshipRelationships(userId: string): Promise<MentorshipRelationship[]> {
    return this.mentorshipRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findMentors(userId: string, criteria: {
    expertiseAreas?: string[];
    industries?: string[];
    careerLevels?: string[];
  }): Promise<MentorProfile[]> {
    const query = this.mentorProfileRepository.createQueryBuilder('mentor')
      .where('mentor.isAvailable = :available', { available: true });

    if (criteria.expertiseAreas?.length) {
      query.andWhere('mentor.expertiseAreas && :areas', { areas: criteria.expertiseAreas });
    }
    if (criteria.industries?.length) {
      query.andWhere('mentor.industries && :industries', { industries: criteria.industries });
    }
    if (criteria.careerLevels?.length) {
      query.andWhere('mentor.careerLevels && :levels', { levels: criteria.careerLevels });
    }

    return query.orderBy('mentor.averageRating', 'DESC').take(10).getMany();
  }

  async addMentorMeeting(relationshipId: string, meeting: any): Promise<MentorshipRelationship> {
    const relationship = await this.getMentorshipRelationship(relationshipId);
    relationship.meetings = [...(relationship.meetings || []), { ...meeting, id: Date.now().toString() }];
    relationship.meetingsCompleted = (relationship.meetingsCompleted || 0) + 1;
    return this.mentorshipRepository.save(relationship);
  }

  async getMentorshipRelationship(relationshipId: string): Promise<MentorshipRelationship> {
    const relationship = await this.mentorshipRepository.findOne({ where: { id: relationshipId } });
    if (!relationship) {
      throw new NotFoundException('Mentorship relationship not found');
    }
    return relationship;
  }

  // ========== Salary Projection Methods ==========

  async getSalaryProjections(userId: string): Promise<SalaryProjection[]> {
    return this.salaryProjectionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async generateSalaryProjection(userId: string, role: string, industry: string, location: string): Promise<SalaryProjection> {
    const baseSalary = this.getBaseSalaryForRole(role);
    const growthRate = this.getGrowthRateForRole(role);

    const projection = this.salaryProjectionRepository.create({
      userId,
      role,
      industry,
      location,
      timeframe: SalaryTimeframe.CURRENT,
      minSalary: baseSalary * 0.8,
      medianSalary: baseSalary,
      maxSalary: baseSalary * 1.3,
      currency: 'USD',
      growthRate,
      projectedSalary: baseSalary * Math.pow(1 + growthRate / 100, 5),
      salaryBreakdown: {
        baseSalary: baseSalary * 0.7,
        bonus: baseSalary * 0.15,
        stockOptions: baseSalary * 0.1,
        benefits: baseSalary * 0.05,
        otherCompensation: 0,
      },
      comparableRoles: this.getComparableRoles(role),
      factors: this.getSalaryFactors(role),
    });

    return this.salaryProjectionRepository.save(projection);
  }

  async addSalaryHistory(userId: string, data: Partial<SalaryHistory>): Promise<SalaryHistory> {
    const history = this.salaryHistoryRepository.create({
      userId,
      ...data,
    });
    return this.salaryHistoryRepository.save(history);
  }

  async getSalaryHistory(userId: string): Promise<SalaryHistory[]> {
    return this.salaryHistoryRepository.find({
      where: { userId },
      order: { startDate: 'DESC' },
    });
  }

  private getBaseSalaryForRole(role: string): number {
    const salaries: Record<string, number> = {
      'software engineer': 120000,
      'senior software engineer': 160000,
      'product manager': 140000,
      'senior product manager': 180000,
      'data scientist': 130000,
      'senior data scientist': 170000,
      'designer': 110000,
      'senior designer': 150000,
      'project manager': 100000,
      'program manager': 130000,
    };
    return salaries[role.toLowerCase()] || 100000;
  }

  private getGrowthRateForRole(role: string): number {
    const highGrowthRoles = ['data scientist', 'ML engineer', 'DevOps engineer'];
    return highGrowthRoles.some(r => role.toLowerCase().includes(r)) ? 8 : 4;
  }

  private getComparableRoles(role: string): any[] {
    return [
      { role: `${role} Lead`, medianSalary: this.getBaseSalaryForRole(role) * 1.3, growthRate: 5 },
      { role: `Principal ${role}`, medianSalary: this.getBaseSalaryForRole(role) * 1.5, growthRate: 4 },
    ];
  }

  private getSalaryFactors(role: string): any[] {
    return [
      { name: 'Skills alignment', impact: 0.2, description: 'Matching skills to role requirements' },
      { name: 'Experience level', impact: 0.3, description: 'Years of relevant experience' },
      { name: 'Company size', impact: 0.15, description: 'Startup vs enterprise compensation' },
      { name: 'Location', impact: 0.2, description: 'Cost of living adjustments' },
      { name: 'Industry', impact: 0.15, description: 'Sector-specific compensation norms' },
    ];
  }

  // ========== Goal Setting Methods ==========

  async createGoal(userId: string, data: Partial<CareerGoal>): Promise<CareerGoal> {
    const goal = this.goalRepository.create({
      userId,
      ...data,
      status: GoalStatus.DRAFT,
      progressPercentage: 0,
      startDate: data.startDate || new Date(),
    });
    return this.goalRepository.save(goal);
  }

  async getGoals(userId: string, timeframe?: GoalTimeframe): Promise<CareerGoal[]> {
    const where: Record<string, unknown> = { userId };
    if (timeframe) where.timeframe = timeframe;
    return this.goalRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async updateGoal(goalId: string, data: Partial<CareerGoal>): Promise<CareerGoal> {
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    Object.assign(goal, data);
    return this.goalRepository.save(goal);
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<CareerGoal> {
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    goal.progressPercentage = Math.min(100, Math.max(0, progress));
    if (goal.progressPercentage >= 100) {
      goal.status = GoalStatus.COMPLETED;
      goal.completedDate = new Date();
    } else if (goal.progressPercentage > 0) {
      goal.status = GoalStatus.ACTIVE;
    }
    return this.goalRepository.save(goal);
  }

  // ========== Industry Trend Methods ==========

  async getIndustryTrends(type?: TrendType): Promise<IndustryTrend[]> {
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    return this.trendRepository.find({
      where,
      order: { demandScore: 'DESC' },
      take: 50,
    });
  }

  async getSkillPredictions(): Promise<SkillPrediction[]> {
    return this.predictionRepository.find({
      order: { urgencyScore: 'DESC' },
      take: 20,
    });
  }

  async getRelevantTrendsForUser(userId: string): Promise<{
    trends: IndustryTrend[];
    predictions: SkillPrediction[];
  }> {
    const skillGaps = await this.skillGapRepository.find({
      where: { userId, isPriority: true },
      take: 10,
    });

    const skills = skillGaps.map(g => g.skillName);

    const trends = await this.trendRepository
      .createQueryBuilder('trend')
      .where('trend.relatedSkills && :skills', { skills })
      .orWhere('trend.isActive = true')
      .orderBy('trend.demandScore', 'DESC')
      .take(10)
      .getMany();

    const predictions = await this.predictionRepository
      .createQueryBuilder('prediction')
      .where('prediction.skill IN (:...skills)', { skills })
      .orWhere('prediction.urgencyScore > :threshold', { threshold: 70 })
      .orderBy('prediction.urgencyScore', 'DESC')
      .take(10)
      .getMany();

    return { trends, predictions };
  }

  // ========== Dashboard/Analytics Methods ==========

  async getCareerDashboard(userId: string): Promise<{
    activeGoals: number;
    completedGoals: number;
    milestonesInProgress: number;
    completedMilestones: number;
    activeSkillGaps: number;
    closedSkillGaps: number;
    activeMentorships: number;
    upcomingMilestones: CareerMilestone[];
    recentGoals: CareerGoal[];
  }> {
    const goals = await this.goalRepository.find({ where: { userId } });
    const milestones = await this.milestoneRepository.find({ where: { userId } });
    const skillGaps = await this.skillGapRepository.find({ where: { userId } });
    const mentorships = await this.mentorshipRepository.find({ where: { userId } });

    return {
      activeGoals: goals.filter(g => g.status === GoalStatus.ACTIVE || g.status === GoalStatus.ON_TRACK).length,
      completedGoals: goals.filter(g => g.status === GoalStatus.COMPLETED).length,
      milestonesInProgress: milestones.filter(m => m.status === MilestoneStatus.IN_PROGRESS).length,
      completedMilestones: milestones.filter(m => m.status === MilestoneStatus.COMPLETED).length,
      activeSkillGaps: skillGaps.length,
      closedSkillGaps: 0, // Would need additional tracking
      activeMentorships: mentorships.filter(m => m.status === MentorshipStatus.ACTIVE).length,
      upcomingMilestones: milestones
        .filter(m => m.status !== MilestoneStatus.COMPLETED)
        .sort((a, b) => new Date(a.targetDate || 0).getTime() - new Date(b.targetDate || 0).getTime())
        .slice(0, 5),
      recentGoals: goals
        .filter(g => g.status !== GoalStatus.CANCELLED)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    };
  }
}
