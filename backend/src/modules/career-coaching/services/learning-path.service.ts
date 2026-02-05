import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningPath } from '../entities/career-coaching.entity';

// Course providers integration
const COURSE_PROVIDERS = [
  { id: 'coursera', name: 'Coursera', url: 'https://www.coursera.org', types: ['certification', 'degree'] },
  { id: 'udemy', name: 'Udemy', url: 'https://www.udemy.com', types: ['course', 'certification'] },
  { id: 'edx', name: 'edX', url: 'https://www.edx.org', types: ['certification', 'degree'] },
  { id: 'linkedin', name: 'LinkedIn Learning', url: 'https://linkedin.com/learning', types: ['course', 'certification'] },
  { id: 'pluralsight', name: 'Pluralsight', url: 'https://www.pluralsight.com', types: ['course', 'certification'] },
  { id: 'frontend-masters', name: 'Frontend Masters', url: 'https://frontendmasters.com', types: ['course', 'certification'] },
  { id: 'egghead', name: 'egghead.io', url: 'https://egghead.io', types: ['course'] },
  { id: 'codecademy', name: 'Codecademy', url: 'https://www.codecademy.com', types: ['course', 'certification'] },
  { id: 'khan', name: 'Khan Academy', url: 'https://www.khanacademy.org', types: ['course'] },
  { id: 'aws', name: 'AWS Training', url: 'https://aws.amazon.com/training', types: ['certification'] },
];

// Course catalog with skill mappings
const COURSE_CATALOG = [
  { id: 'js-fundamentals', title: 'JavaScript Fundamentals', skills: ['JavaScript'], provider: 'coursera', duration: 20, difficulty: 'beginner', rating: 4.8, type: 'course' },
  { id: 'ts-essentials', title: 'TypeScript Essentials', skills: ['TypeScript'], provider: 'frontend-masters', duration: 15, difficulty: 'intermediate', rating: 4.9, type: 'course' },
  { id: 'react-complete', title: 'Complete React Developer', skills: ['React'], provider: 'udemy', duration: 40, difficulty: 'intermediate', rating: 4.7, type: 'course' },
  { id: 'node-master', title: 'Node.js Masterclass', skills: ['Node.js'], provider: 'frontend-masters', duration: 25, difficulty: 'intermediate', rating: 4.8, type: 'course' },
  { id: 'python-pro', title: 'Python for Professionals', skills: ['Python'], provider: 'edx', duration: 30, difficulty: 'beginner', rating: 4.6, type: 'course' },
  { id: 'aws-solutions-architect', title: 'AWS Solutions Architect', skills: ['AWS'], provider: 'aws', duration: 80, difficulty: 'advanced', rating: 4.9, type: 'certification' },
  { id: 'sql-database', title: 'SQL & Database Design', skills: ['SQL', 'PostgreSQL'], provider: 'codecademy', duration: 20, difficulty: 'beginner', rating: 4.5, type: 'course' },
  { id: 'docker-deep', title: 'Docker Deep Dive', skills: ['Docker'], provider: 'pluralsight', duration: 15, difficulty: 'intermediate', rating: 4.7, type: 'course' },
  { id: 'kubernetes-admin', title: 'Kubernetes Administrator', skills: ['Kubernetes'], provider: 'pluralsight', duration: 35, difficulty: 'advanced', rating: 4.8, type: 'certification' },
  { id: 'leadership-skills', title: 'Leadership Skills', skills: ['Leadership'], provider: 'linkedin', duration: 10, difficulty: 'intermediate', rating: 4.6, type: 'course' },
  { id: 'agile-scrum', title: 'Agile & Scrum Master', skills: ['Agile', 'Scrum'], provider: 'linkedin', duration: 8, difficulty: 'intermediate', rating: 4.5, type: 'certification' },
  { id: 'data-science-python', title: 'Data Science with Python', skills: ['Python', 'Data Analysis', 'Machine Learning'], provider: 'coursera', duration: 60, difficulty: 'intermediate', rating: 4.7, type: 'certification' },
  { id: 'ml-basics', title: 'Machine Learning Basics', skills: ['Machine Learning', 'Statistics'], provider: 'coursera', duration: 40, difficulty: 'intermediate', rating: 4.8, type: 'course' },
  { id: 'system-design', title: 'System Design Fundamentals', skills: ['System Design'], provider: 'frontend-masters', duration: 20, difficulty: 'advanced', rating: 4.9, type: 'course' },
  { id: 'git-pro', title: 'Git & Version Control', skills: ['Git'], provider: 'linkedin', duration: 10, difficulty: 'beginner', rating: 4.6, type: 'course' },
];

export interface LearningPathInput {
  userId: string;
  targetRole: string;
  currentSkills: string[];
  preferredPace: 'intensive' | 'moderate' | 'relaxed';
  dailyHoursAvailable: number;
  certificates: string[];
}

export interface Course {
  id: string;
  title: string;
  skills: string[];
  provider: string;
  duration: number;
  difficulty: string;
  rating: number;
  type: string;
  url: string;
  completed?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  courses: string[];
  skills: string[];
  estimatedTime: number;
  deadline: Date;
  completed: boolean;
}

@Injectable()
export class LearningPathService {
  private readonly logger = new Logger(LearningPathService.name);
  private readonly pathsGenerated = 10000;
  private readonly completionRate = 0.7;

  constructor(
    @InjectRepository(LearningPath)
    private readonly learningPathRepository: Repository<LearningPath>,
  ) {}

  async generatePath(input: LearningPathInput): Promise<LearningPath> {
    this.logger.log(`Generating learning path for user ${input.userId} targeting ${input.targetRole}`);

    // Identify required skills for target role
    const requiredSkills = this.getRequiredSkills(input.targetRole);
    const skillGaps = requiredSkills.filter(skill => 
      !input.currentSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
    );

    // Select courses to fill gaps
    const courses = this.selectCourses(skillGaps, input.currentSkills);
    
    // Create milestones based on pace
    const milestones = this.createMilestones(courses, input.preferredPace, input.dailyHoursAvailable);
    
    // Calculate estimated time
    const estimatedTime = courses.reduce((sum, c) => sum + c.duration, 0);

    const path = this.learningPathRepository.create({
      userId: input.userId,
      targetRole: input.targetRole,
      courses: courses,
      milestones: milestones,
      estimatedTime,
      progress: 0,
      status: 'active',
    });

    const saved = await this.learningPathRepository.save(path);
    return saved;
  }

  async getPath(pathId: string): Promise<LearningPath | null> {
    return this.learningPathRepository.findOne({ where: { id: pathId } });
  }

  async updateProgress(pathId: string, courseId: string, completed: boolean): Promise<LearningPath> {
    const path = await this.learningPathRepository.findOne({ where: { id: pathId } });
    if (!path) throw new Error('Learning path not found');

    const courses = (path.courses as Course[]) || [];
    const courseIndex = courses.findIndex((c: Course) => c.id === courseId);
    
    if (courseIndex !== -1) {
      courses[courseIndex] = { ...courses[courseIndex], completed };
    }

    // Update progress percentage
    const completedCourses = courses.filter((c: Course) => c.completed).length;
    path.progress = courses.length > 0 ? (completedCourses / courses.length) * 100 : 0;

    // Update milestone completion
    const milestones = (path.milestones as Milestone[]) || [];
    milestones.forEach(milestone => {
      const milestoneCourses = courses.filter((c: Course) => milestone.courses.includes(c.id));
      const allCompleted = milestoneCourses.every((c: Course) => c.completed);
      milestone.completed = allCompleted;
    });

    // Check if path is completed
    if (path.progress >= 100) {
      path.status = 'completed';
      path.completedAt = new Date();
    }

    await this.learningPathRepository.save(path);
    return path;
  }

  async getCourses(pathId: string): Promise<Course[]> {
    const path = await this.learningPathRepository.findOne({ where: { id: pathId } });
    if (!path) throw new Error('Learning path not found');
    return (path.courses as Course[]) || [];
  }

  async getCertificates(userId: string): Promise<any[]> {
    const paths = await this.learningPathRepository.find({ where: { userId } });
    const certificates: any[] = [];

    paths.forEach(path => {
      const courses = (path.courses as Course[]) || [];
      courses.forEach(course => {
        if (course.type === 'certification' && (path.progress as number) >= 50) {
          certificates.push({
            courseId: course.id,
            courseTitle: course.title,
            provider: course.provider,
            pathId: path.id,
            earnedAt: path.completedAt,
          });
        }
      });
    });

    return certificates;
  }

  private getRequiredSkills(targetRole: string): string[] {
    const roleSkills: Record<string, string[]> = {
      'software-engineer': ['JavaScript', 'Git', 'REST APIs', 'Problem Solving', 'SQL'],
      'senior-software-engineer': ['TypeScript', 'React', 'Node.js', 'System Design', 'AWS'],
      'engineering-manager': ['Leadership', 'Agile', 'Scrum', 'Communication', 'Strategic Planning'],
      'product-manager': ['Product Strategy', 'Data Analysis', 'Communication', 'Roadmapping'],
      'data-scientist': ['Python', 'Machine Learning', 'SQL', 'Data Visualization'],
      'devops-engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
      'frontend-developer': ['React', 'TypeScript', 'CSS3', 'HTML5', 'Git'],
      'backend-developer': ['Node.js', 'Python', 'SQL', 'REST APIs', 'Docker'],
      'full-stack-developer': ['React', 'Node.js', 'SQL', 'TypeScript', 'Docker'],
      'tech-lead': ['System Design', 'Leadership', 'AWS', 'Architecture', 'Mentoring'],
    };

    return roleSkills[targetRole.toLowerCase().replace(/\s+/g, '-')] || 
           roleSkills['software-engineer'];
  }

  private selectCourses(skillGaps: string[], currentSkills: string[]): Course[] {
    const selectedCourses: Course[] = [];
    const usedCourseIds = new Set<string>();

    // First, add foundational courses for skills the user doesn't have
    skillGaps.forEach(skill => {
      const relevantCourses = COURSE_CATALOG.filter(
        course => course.skills.some(s => s.toLowerCase() === skill.toLowerCase()) && 
                  !usedCourseIds.has(course.id)
      );

      if (relevantCourses.length > 0) {
        // Select the highest rated course for this skill
        const bestCourse = relevantCourses.sort((a, b) => b.rating - a.rating)[0];
        selectedCourses.push({ ...bestCourse, url: COURSE_PROVIDERS.find(p => p.id === bestCourse.provider)?.url + '/course/' + bestCourse.id });
        usedCourseIds.add(bestCourse.id);
      }
    });

    // Add some enhancement courses
    const enhancementSkills = ['Leadership', 'Communication', 'System Design'];
    enhancementSkills.forEach(skill => {
      const relevantCourses = COURSE_CATALOG.filter(
        course => course.skills.some(s => s === skill) && 
                  !usedCourseIds.has(course.id)
      );

      if (relevantCourses.length > 0) {
        const course = relevantCourses[0];
        selectedCourses.push({ ...course, url: COURSE_PROVIDERS.find(p => p.id === course.provider)?.url + '/course/' + course.id });
        usedCourseIds.add(course.id);
      }
    });

    return selectedCourses;
  }

  private createMilestones(
    courses: Course[],
    pace: 'intensive' | 'moderate' | 'relaxed',
    dailyHours: number
  ): Milestone[] {
    const paceMultipliers = {
      'intensive': 0.6,
      'moderate': 1,
      'relaxed': 1.5,
    };

    const multiplier = paceMultipliers[pace];
    const milestoneCount = Math.ceil(courses.length / 3);
    const coursesPerMilestone = Math.ceil(courses.length / milestoneCount);

    const milestones: Milestone[] = [];
    let courseIndex = 0;

    for (let i = 0; i < milestoneCount; i++) {
      const milestoneCourses = courses.slice(courseIndex, courseIndex + coursesPerMilestone);
      const totalDuration = milestoneCourses.reduce((sum, c) => sum + c.duration, 0);
      
      // Calculate deadline based on pace and available time
      const daysNeeded = Math.ceil(totalDuration / (dailyHours * multiplier));
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + daysNeeded);

      milestones.push({
        id: `m${i + 1}`,
        title: this.getMilestoneTitle(i, milestoneCount),
        description: `Complete ${milestoneCourses.length} courses covering ${milestoneCourses.map(c => c.title).join(', ')}`,
        courses: milestoneCourses.map(c => c.id),
        skills: [...new Set(milestoneCourses.flatMap(c => c.skills))],
        estimatedTime: totalDuration,
        deadline,
        completed: false,
      });

      courseIndex += coursesPerMilestone;
    }

    return milestones;
  }

  private getMilestoneTitle(index: number, total: number): string {
    const titles = [
      'Foundation Building',
      'Core Skills Development',
      'Advanced Techniques',
      'Expert Proficiency',
      'Specialization',
      'Mastery & Certification',
    ];

    if (index < titles.length) {
      return `${titles[index]} (${index + 1}/${total})`;
    }

    return `Milestone ${index + 1} (${index + 1}/${total})`;
  }
}
