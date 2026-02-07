import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@justlikethat.app' },
    update: {},
    create: {
      email: 'demo@justlikethat.app',
      passwordHash: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      emailVerified: true,
      onboardingCompleted: true,
      profile: {
        create: {
          summary: 'Full-stack developer with 5 years of experience',
          skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
          experience: [
            { title: 'Senior Developer', company: 'TechCorp', years: 3 },
            { title: 'Developer', company: 'StartupInc', years: 2 },
          ],
          education: [{ degree: 'BS Computer Science', school: 'State University', year: 2019 }],
          location: 'San Francisco, CA',
          remotePreference: 'REMOTE',
        },
      },
      preferences: {
        create: {
          jobTitle: 'Senior Full-Stack Developer',
          desiredLocations: ['San Francisco', 'New York', 'Remote'],
          remotePreference: 'REMOTE',
          salaryMin: 120000,
          salaryMax: 180000,
          jobTypes: ['FULL_TIME'],
          industries: ['Technology', 'SaaS', 'Fintech'],
        },
      },
    },
    include: { profile: true },
  });

  // Create default persona
  if (user.profile) {
    await prisma.persona.upsert({
      where: { id: 'demo-persona-1' },
      update: {},
      create: {
        id: 'demo-persona-1',
        userId: user.id,
        profileId: user.profile.id,
        name: 'Full-Stack Engineer',
        targetRole: 'Senior Full-Stack Developer',
        experienceLevel: 'SENIOR',
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
        isDefault: true,
      },
    });
  }

  // Create sample job postings
  const jobPostings = [
    {
      title: 'Senior Full-Stack Engineer',
      company: 'TechCo',
      location: 'San Francisco, CA',
      remotePreference: 'REMOTE' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 150000, max: 200000 },
      description: 'We are looking for a Senior Full-Stack Engineer to join our growing team. You will work on our core platform using React, Node.js, and PostgreSQL.',
      requirements: ['5+ years experience', 'React proficiency', 'Node.js expertise', 'SQL databases'],
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
      applyUrl: 'https://example.com/apply/1',
      externalId: 'seed-job-1',
      publishedAt: new Date('2025-01-15'),
    },
    {
      title: 'Frontend Engineer',
      company: 'DesignStudio',
      location: 'New York, NY',
      remotePreference: 'HYBRID' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 120000, max: 160000 },
      description: 'Join our creative team building beautiful, performant web applications. We use Next.js, Tailwind CSS, and modern frontend tooling.',
      requirements: ['3+ years frontend experience', 'Next.js', 'CSS/Tailwind'],
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Figma'],
      applyUrl: 'https://example.com/apply/2',
      externalId: 'seed-job-2',
      publishedAt: new Date('2025-01-20'),
    },
    {
      title: 'Backend Developer',
      company: 'DataFlow Inc',
      location: 'Austin, TX',
      remotePreference: 'REMOTE' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 130000, max: 170000 },
      description: 'Build scalable backend services and APIs. Our stack includes NestJS, PostgreSQL, Redis, and Kubernetes.',
      requirements: ['4+ years backend experience', 'NestJS or Express', 'PostgreSQL'],
      skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes'],
      applyUrl: 'https://example.com/apply/3',
      externalId: 'seed-job-3',
      publishedAt: new Date('2025-01-22'),
    },
    {
      title: 'DevOps Engineer',
      company: 'CloudNative Co',
      location: 'Seattle, WA',
      remotePreference: 'REMOTE' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 140000, max: 190000 },
      description: 'Manage and improve our cloud infrastructure on AWS. CI/CD pipelines, monitoring, and infrastructure-as-code.',
      requirements: ['3+ years DevOps', 'AWS certified', 'Terraform experience'],
      skills: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'GitHub Actions', 'Prometheus'],
      applyUrl: 'https://example.com/apply/4',
      externalId: 'seed-job-4',
      publishedAt: new Date('2025-01-25'),
    },
    {
      title: 'React Native Developer',
      company: 'MobileFirst',
      location: 'Los Angeles, CA',
      remotePreference: 'HYBRID' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 110000, max: 150000 },
      description: 'Build cross-platform mobile apps with React Native. Work closely with designers and backend engineers.',
      requirements: ['2+ years React Native', 'Published apps on App Store/Play Store'],
      skills: ['React Native', 'TypeScript', 'iOS', 'Android', 'Redux'],
      applyUrl: 'https://example.com/apply/5',
      externalId: 'seed-job-5',
      publishedAt: new Date('2025-01-28'),
    },
    {
      title: 'Staff Engineer',
      company: 'BigTech Corp',
      location: 'Mountain View, CA',
      remotePreference: 'ONSITE' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 200000, max: 300000 },
      description: 'Lead technical architecture for a new product line. Mentor engineers and drive technical excellence.',
      requirements: ['8+ years experience', 'System design expertise', 'Leadership experience'],
      skills: ['System Design', 'TypeScript', 'Go', 'PostgreSQL', 'Kafka', 'AWS'],
      applyUrl: 'https://example.com/apply/6',
      externalId: 'seed-job-6',
      publishedAt: new Date('2025-02-01'),
    },
    {
      title: 'Junior Developer',
      company: 'LearnTech Academy',
      location: 'Remote',
      remotePreference: 'REMOTE' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 60000, max: 80000 },
      description: 'Great opportunity for a junior developer to grow. Mentorship program included. Work on our learning platform.',
      requirements: ['0-2 years experience', 'JavaScript/TypeScript basics', 'Eagerness to learn'],
      skills: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
      applyUrl: 'https://example.com/apply/7',
      externalId: 'seed-job-7',
      publishedAt: new Date('2025-02-03'),
    },
    {
      title: 'Data Engineer',
      company: 'Analytics Pro',
      location: 'Chicago, IL',
      remotePreference: 'HYBRID' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 130000, max: 175000 },
      description: 'Design and build data pipelines. Work with large-scale data processing and real-time analytics.',
      requirements: ['3+ years data engineering', 'Python', 'SQL', 'Spark or similar'],
      skills: ['Python', 'SQL', 'Spark', 'Airflow', 'AWS', 'dbt'],
      applyUrl: 'https://example.com/apply/8',
      externalId: 'seed-job-8',
      publishedAt: new Date('2025-02-05'),
    },
    {
      title: 'Product Engineer',
      company: 'SaaS Startup',
      location: 'Denver, CO',
      remotePreference: 'REMOTE' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 125000, max: 165000 },
      description: 'Own features end-to-end from ideation to deployment. Small team, high impact. Next.js + NestJS stack.',
      requirements: ['3+ years full-stack', 'Product mindset', 'Strong communication'],
      skills: ['React', 'Next.js', 'Node.js', 'NestJS', 'PostgreSQL', 'TypeScript'],
      applyUrl: 'https://example.com/apply/9',
      externalId: 'seed-job-9',
      publishedAt: new Date('2025-02-06'),
    },
    {
      title: 'Security Engineer',
      company: 'SecureNet',
      location: 'Washington, DC',
      remotePreference: 'ONSITE' as const,
      jobType: 'FULL_TIME' as const,
      salaryRange: { min: 145000, max: 195000 },
      description: 'Protect our infrastructure and applications. Penetration testing, security audits, and incident response.',
      requirements: ['4+ years security experience', 'CISSP or equivalent', 'Cloud security'],
      skills: ['Security', 'Penetration Testing', 'AWS', 'SIEM', 'Python', 'Compliance'],
      applyUrl: 'https://example.com/apply/10',
      externalId: 'seed-job-10',
      publishedAt: new Date('2025-02-07'),
    },
  ];

  for (const job of jobPostings) {
    await prisma.jobPosting.upsert({
      where: { externalId: job.externalId },
      update: job,
      create: job,
    });
  }

  // Create sample applications for the demo user
  const jobs = await prisma.jobPosting.findMany({ take: 3 });
  for (let i = 0; i < Math.min(3, jobs.length); i++) {
    const states = ['SUBMITTED', 'INTERVIEWING', 'DRAFT'] as const;
    await prisma.application.upsert({
      where: { userId_jobPostingId: { userId: user.id, jobPostingId: jobs[i].id } },
      update: {},
      create: {
        userId: user.id,
        jobPostingId: jobs[i].id,
        state: states[i],
        autonomyMode: 'MANUAL',
        submittedAt: states[i] !== 'DRAFT' ? new Date() : null,
      },
    });
  }

  console.log('Seed complete!');
  console.log(`  - 1 demo user (demo@justlikethat.app / password123)`);
  console.log(`  - ${jobPostings.length} job postings`);
  console.log(`  - 3 sample applications`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
