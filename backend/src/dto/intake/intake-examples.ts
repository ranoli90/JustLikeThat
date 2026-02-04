import { IntakeFormData, DerivedProfile } from './intake-questions.zod';

// Example 1: New Grad (Computer Science)
export const newGradIntake: IntakeFormData = {
  careerGoals: {
    shortTermGoal: 'Secure an entry-level software engineering position where I can apply my coding skills and learn from experienced developers.',
    longTermGoal: 'Become a senior software engineer specializing in web development and contribute to open-source projects.',
    targetRole: 'Junior Software Engineer',
    targetIndustry: 'Technology',
    desiredImpact: 'Create user-friendly applications that solve real-world problems and improve people\'s lives.',
  },
  skills: {
    technicalSkills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS'],
    softSkills: ['Communication', 'Teamwork', 'Problem Solving', 'Time Management'],
    technicalSkillLevels: {
      JavaScript: 'INTERMEDIATE',
      React: 'BEGINNER',
      'Node.js': 'BEGINNER',
      HTML: 'ADVANCED',
      CSS: 'ADVANCED',
    },
    softSkillLevels: {
      Communication: 'INTERMEDIATE',
      Teamwork: 'ADVANCED',
      'Problem Solving': 'INTERMEDIATE',
      'Time Management': 'BEGINNER',
    },
  },
  constraints: {
    salaryRange: {
      min: 60000,
      max: 80000,
    },
    locationPreferences: ['San Francisco', 'New York', 'Remote'],
    remoteWorkPreference: 'FLEXIBLE',
    visaRequirements: 'SPONSORSHIP_REQUIRED',
    workAuthorization: false,
    minimumExperienceLevel: 'JUNIOR',
  },
  preferences: {
    companySize: ['STARTUP', 'SMALL', 'MEDIUM'],
    companyCulture: ['INNOVATIVE', 'COLLABORATIVE'],
    workLifeBalance: 'BALANCED',
    professionalDevelopment: 'HIGH_PRIORITY',
    compensationStructure: ['BASE_SALARY', 'BENEFITS'],
    commuteTime: 30,
    projectType: ['PRODUCT_DEVELOPMENT', 'RESEARCH'],
  },
  riskTolerance: {
    jobSecurity: 'MODERATE',
    financialRisk: 'LOW',
    careerRisk: 'MODERATE',
    willingnessToRelocate: 'MAYBE',
    willingnessToTravel: 'OCCASIONAL',
  },
};

// Example 2: Mid-Career Switcher (Finance to Tech)
export const midCareerSwitcherIntake: IntakeFormData = {
  careerGoals: {
    shortTermGoal: 'Transition from finance to tech and become a data analyst or business intelligence specialist.',
    longTermGoal: 'Progress into a data engineering or machine learning role within 3-5 years.',
    targetRole: 'Data Analyst',
    targetIndustry: 'Finance, Technology',
    desiredImpact: 'Help companies make data-driven decisions and optimize their business processes.',
  },
  skills: {
    technicalSkills: ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI'],
    softSkills: ['Analytical Thinking', 'Communication', 'Problem Solving', 'Attention to Detail'],
    technicalSkillLevels: {
      SQL: 'ADVANCED',
      Python: 'INTERMEDIATE',
      Excel: 'EXPERT',
      Tableau: 'INTERMEDIATE',
      'Power BI': 'BEGINNER',
    },
    softSkillLevels: {
      'Analytical Thinking': 'EXPERT',
      Communication: 'ADVANCED',
      'Problem Solving': 'ADVANCED',
      'Attention to Detail': 'EXPERT',
    },
  },
  constraints: {
    salaryRange: {
      min: 80000,
      max: 120000,
    },
    locationPreferences: ['Chicago', 'Boston', 'Remote'],
    remoteWorkPreference: 'HYBRID_ONLY',
    visaRequirements: 'NONE',
    workAuthorization: true,
    minimumExperienceLevel: 'MID',
  },
  preferences: {
    companySize: ['MEDIUM', 'LARGE', 'ENTERPRISE'],
    companyCulture: ['TRADITIONAL', 'COLLABORATIVE'],
    workLifeBalance: 'BALANCED',
    professionalDevelopment: 'HIGH_PRIORITY',
    compensationStructure: ['BASE_SALARY', 'BONUS', 'BENEFITS'],
    commuteTime: 45,
    projectType: ['CONSULTING', 'PRODUCT_DEVELOPMENT'],
  },
  riskTolerance: {
    jobSecurity: 'HIGH',
    financialRisk: 'MODERATE',
    careerRisk: 'MODERATE',
    willingnessToRelocate: 'NO',
    willingnessToTravel: 'OCCASIONAL',
  },
};

// Example 3: Experienced Professional (Senior Software Engineer)
export const experiencedProfessionalIntake: IntakeFormData = {
  careerGoals: {
    shortTermGoal: 'Lead a team of developers and architect scalable web applications.',
    longTermGoal: 'Become a CTO or senior technical leader in a fast-growing tech company.',
    targetRole: 'Senior Software Engineer',
    targetIndustry: 'Technology, FinTech',
    desiredImpact: 'Drive technical innovation and mentorship within the engineering team.',
  },
  skills: {
    technicalSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'AWS', 'GraphQL'],
    softSkills: ['Leadership', 'Communication', 'Problem Solving', 'Mentorship'],
    technicalSkillLevels: {
      JavaScript: 'EXPERT',
      React: 'EXPERT',
      'Node.js': 'ADVANCED',
      TypeScript: 'ADVANCED',
      AWS: 'INTERMEDIATE',
      GraphQL: 'ADVANCED',
    },
    softSkillLevels: {
      Leadership: 'ADVANCED',
      Communication: 'EXPERT',
      'Problem Solving': 'EXPERT',
      Mentorship: 'ADVANCED',
    },
  },
  constraints: {
    salaryRange: {
      min: 150000,
      max: 250000,
    },
    locationPreferences: ['San Francisco', 'Seattle', 'Remote'],
    remoteWorkPreference: 'REMOTE_ONLY',
    visaRequirements: 'NONE',
    workAuthorization: true,
    minimumExperienceLevel: 'SENIOR',
  },
  preferences: {
    companySize: ['SMALL', 'MEDIUM', 'LARGE'],
    companyCulture: ['INNOVATIVE', 'COLLABORATIVE', 'COMPETITIVE'],
    workLifeBalance: 'WORK_FOCUSED',
    professionalDevelopment: 'MODERATE',
    compensationStructure: ['BASE_SALARY', 'BONUS', 'EQUITY'],
    commuteTime: 0,
    projectType: ['PRODUCT_DEVELOPMENT', 'STARTUP'],
  },
  riskTolerance: {
    jobSecurity: 'MODERATE',
    financialRisk: 'HIGH',
    careerRisk: 'HIGH',
    willingnessToRelocate: 'YES',
    willingnessToTravel: 'FREQUENT',
  },
};

// Derived profiles for each example
export const newGradDerived: DerivedProfile = {
  candidateType: 'NEW_GRAD',
  careerStage: 'ENTRY',
  skillsGraph: {
    technical: {
      javascript: 0.5,
      react: 0.25,
      nodejs: 0.25,
      html: 0.75,
      css: 0.75,
    },
    soft: {
      communication: 0.5,
      teamwork: 0.75,
      'problem solving': 0.5,
      'time management': 0.25,
    },
  },
  constraints: {
    salary: {
      min: 60000,
      max: 80000,
    },
    locations: ['San Francisco', 'New York', 'Remote'],
    remoteWork: 'FLEXIBLE',
    visa: 'SPONSORSHIP_REQUIRED',
  },
  preferences: {
    companySize: ['STARTUP', 'SMALL', 'MEDIUM'],
    companyCulture: ['INNOVATIVE', 'COLLABORATIVE'],
    workLifeBalance: 'BALANCED',
    professionalDevelopment: 'HIGH_PRIORITY',
  },
  riskProfile: {
    jobSecurity: 'MODERATE',
    financialRisk: 'LOW',
    careerRisk: 'MODERATE',
  },
  fairnessFlags: [
    {
      field: 'visaRequirements',
      flagType: 'EXCLUSIONARY',
      severity: 'HIGH',
      description: 'Requiring no visa sponsorship may exclude qualified international candidates',
    },
  ],
};

export const midCareerSwitcherDerived: DerivedProfile = {
  candidateType: 'MID_CAREER_SWITCHER',
  careerStage: 'MID',
  skillsGraph: {
    technical: {
      sql: 0.75,
      python: 0.5,
      excel: 1.0,
      tableau: 0.5,
      'power bi': 0.25,
    },
    soft: {
      'analytical thinking': 1.0,
      communication: 0.75,
      'problem solving': 0.75,
      'attention to detail': 1.0,
    },
  },
  constraints: {
    salary: {
      min: 80000,
      max: 120000,
    },
    locations: ['Chicago', 'Boston', 'Remote'],
    remoteWork: 'HYBRID_ONLY',
    visa: 'NONE',
  },
  preferences: {
    companySize: ['MEDIUM', 'LARGE', 'ENTERPRISE'],
    companyCulture: ['TRADITIONAL', 'COLLABORATIVE'],
    workLifeBalance: 'BALANCED',
    professionalDevelopment: 'HIGH_PRIORITY',
  },
  riskProfile: {
    jobSecurity: 'HIGH',
    financialRisk: 'MODERATE',
    careerRisk: 'MODERATE',
  },
  fairnessFlags: [
    {
      field: 'visaRequirements',
      flagType: 'EXCLUSIONARY',
      severity: 'HIGH',
      description: 'Requiring no visa sponsorship may exclude qualified international candidates',
    },
  ],
};

export const experiencedProfessionalDerived: DerivedProfile = {
  candidateType: 'EXPERIENCED_PROFESSIONAL',
  careerStage: 'SENIOR',
  skillsGraph: {
    technical: {
      javascript: 1.0,
      react: 1.0,
      nodejs: 0.75,
      typescript: 0.75,
      aws: 0.5,
      graphql: 0.75,
    },
    soft: {
      leadership: 0.75,
      communication: 1.0,
      'problem solving': 1.0,
      mentorship: 0.75,
    },
  },
  constraints: {
    salary: {
      min: 150000,
      max: 250000,
    },
    locations: ['San Francisco', 'Seattle', 'Remote'],
    remoteWork: 'REMOTE_ONLY',
    visa: 'NONE',
  },
  preferences: {
    companySize: ['SMALL', 'MEDIUM', 'LARGE'],
    companyCulture: ['INNOVATIVE', 'COLLABORATIVE', 'COMPETITIVE'],
    workLifeBalance: 'WORK_FOCUSED',
    professionalDevelopment: 'MODERATE',
  },
  riskProfile: {
    jobSecurity: 'MODERATE',
    financialRisk: 'HIGH',
    careerRisk: 'HIGH',
  },
  fairnessFlags: [
    {
      field: 'visaRequirements',
      flagType: 'EXCLUSIONARY',
      severity: 'HIGH',
      description: 'Requiring no visa sponsorship may exclude qualified international candidates',
    },
    {
      field: 'minimumExperienceLevel',
      flagType: 'EXCLUSIONARY',
      severity: 'MEDIUM',
      description: 'Experience level requirement may be too high and exclude qualified mid-career candidates',
    },
  ],
};
