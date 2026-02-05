import { Injectable } from '@nestjs/common';
import { IntakeFormData, DerivedProfile } from '../../dto/intake/intake-questions.zod';

/**
 * Service for processing user intake data and deriving candidate profiles
 */
@Injectable()
export class IntakeService {
  /**
   * Processes raw intake form data into a derived candidate profile
   * @param data - The raw intake form data
   * @returns Derived profile with normalized skills, preferences, and risk assessment
   */
  processIntakeData(data: IntakeFormData): DerivedProfile {
    const candidateType = this.determineCandidateType(data);
    const careerStage = this.determineCareerStage(data);
    const skillsGraph = this.buildSkillsGraph(data);
    const constraints = this.processConstraints(data);
    const preferences = this.processPreferences(data);
    const riskProfile = this.processRiskProfile(data);
    const fairnessFlags = this.detectFairnessIssues(data);

    return {
      candidateType,
      careerStage,
      skillsGraph,
      constraints,
      preferences,
      riskProfile,
      fairnessFlags,
    };
  }

  /**
   * Determines candidate type based on experience and career goals
   * @param data - The intake form data
   * @returns The determined candidate type
   */
  private determineCandidateType(data: IntakeFormData): DerivedProfile['candidateType'] {
    // New Grad: Recent education, minimal experience, entry-level goals
    if (data.careerGoals.shortTermGoal.toLowerCase().includes('entry') || 
        data.careerGoals.targetRole.toLowerCase().includes('junior') ||
        data.skills.technicalSkills.length < 5) {
      return 'NEW_GRAD';
    }

    // Mid-Career Switcher: Changing industries/roles, diverse skills
    if (data.careerGoals.shortTermGoal.toLowerCase().includes('switch') || 
        data.careerGoals.targetRole.toLowerCase() !== data.skills.technicalSkills.join(' ').toLowerCase()) {
      return 'MID_CAREER_SWITCHER';
    }

    // Experienced Professional: Clear career progression, specialized skills
    return 'EXPERIENCED_PROFESSIONAL';
  }

  /**
   * Determines career stage based on experience level and skills
   * @param data - The intake form data
   * @returns The determined career stage
   */
  private determineCareerStage(data: IntakeFormData): DerivedProfile['careerStage'] {
    const minExp = data.constraints.minimumExperienceLevel;
    
    switch (minExp) {
      case 'JUNIOR':
        return 'JUNIOR';
      case 'MID':
        return 'MID';
      case 'SENIOR':
        return 'SENIOR';
      case 'LEAD':
        return 'EXECUTIVE';
      default:
        // Default based on skills and goals
        if (data.skills.technicalSkills.length > 10) {
          return 'SENIOR';
        }
        return 'ENTRY';
    }
  }

  /**
   * Builds a normalized skills graph with weighted skills
   * @param data - The intake form data
   * @returns Skills graph with technical and soft skills
   */
  private buildSkillsGraph(data: IntakeFormData) {
    const technicalSkills: Record<string, number> = {};
    const softSkills: Record<string, number> = {};

    // Process technical skills
    data.skills.technicalSkills.forEach((skill, index) => {
      const level = data.skills.technicalSkillLevels?.[skill] || 'INTERMEDIATE';
      const weight = this.calculateSkillWeight(level);
      technicalSkills[skill.toLowerCase()] = weight;
    });

    // Process soft skills
    data.skills.softSkills.forEach((skill, index) => {
      const level = data.skills.softSkillLevels?.[skill] || 'INTERMEDIATE';
      const weight = this.calculateSkillWeight(level);
      softSkills[skill.toLowerCase()] = weight;
    });

    return { technical: technicalSkills, soft: softSkills };
  }

  // Calculate skill weight based on proficiency level
  private calculateSkillWeight(level: string): number {
    const levelWeights: Record<string, number> = {
      BEGINNER: 0.25,
      INTERMEDIATE: 0.5,
      ADVANCED: 0.75,
      EXPERT: 1.0,
    };
    return levelWeights[level] || 0.5;
  }

  // Process constraints into structured format
  private processConstraints(data: IntakeFormData) {
    return {
      salary: data.constraints.salaryRange,
      locations: data.constraints.locationPreferences,
      remoteWork: data.constraints.remoteWorkPreference,
      visa: data.constraints.visaRequirements,
    };
  }

  // Process preferences into structured format with normalized weights
  private processPreferences(data: IntakeFormData) {
    return {
      companySize: data.preferences.companySize,
      companyCulture: data.preferences.companyCulture,
      workLifeBalance: data.preferences.workLifeBalance,
      professionalDevelopment: data.preferences.professionalDevelopment,
    };
  }

  // Process risk tolerance into risk profile
  private processRiskProfile(data: IntakeFormData) {
    return {
      jobSecurity: data.riskTolerance.jobSecurity,
      financialRisk: data.riskTolerance.financialRisk,
      careerRisk: data.riskTolerance.careerRisk,
    };
  }

  // Detect potential fairness issues in the intake data
  private detectFairnessIssues(data: IntakeFormData) {
    const flags: Array<{
      field: string;
      flagType: 'DISCRIMINATORY' | 'EXCLUSIONARY' | 'BIAS_RISK';
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
    }> = [];

    // Check for exclusionary location preferences
    if (data.constraints.locationPreferences?.length === 1 && 
        (data.constraints.locationPreferences[0].toLowerCase() === 'local' || 
         data.constraints.locationPreferences[0].toLowerCase() === 'same city')) {
      flags.push({
        field: 'locationPreferences',
        flagType: 'EXCLUSIONARY',
        severity: 'MEDIUM',
        description: 'Location preference may be too narrow and exclude qualified candidates from other areas',
      });
    }

    // Check for salary range issues (too low or too high)
    if (data.constraints.salaryRange?.min && data.constraints.salaryRange.min < 30000) {
      flags.push({
        field: 'salaryRange',
        flagType: 'BIAS_RISK',
        severity: 'LOW',
        description: 'Minimum salary may be below fair market value for the target role',
      });
    }

    if (data.constraints.salaryRange?.max && data.constraints.salaryRange.max > 500000) {
      flags.push({
        field: 'salaryRange',
        flagType: 'BIAS_RISK',
        severity: 'MEDIUM',
        description: 'Maximum salary may be set unrealistically high for the target role',
      });
    }

    // Check for visa sponsorship requirements
    if (data.constraints.visaRequirements === 'NONE') {
      flags.push({
        field: 'visaRequirements',
        flagType: 'EXCLUSIONARY',
        severity: 'HIGH',
        description: 'Requiring no visa sponsorship may exclude qualified international candidates',
      });
    }

    // Check for narrow experience level requirements
    if (data.constraints.minimumExperienceLevel && 
        !['JUNIOR', 'MID'].includes(data.constraints.minimumExperienceLevel)) {
      flags.push({
        field: 'minimumExperienceLevel',
        flagType: 'EXCLUSIONARY',
        severity: 'MEDIUM',
        description: 'Experience level requirement may be too high and exclude qualified mid-career candidates',
      });
    }

    return flags;
  }
}
