import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntakeService {
  private readonly logger = new Logger(IntakeService.name);

  constructor(private prisma: PrismaService) {}

  async submitIntake(userId: string, data: any) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.candidateProfile.upsert({
        where: { userId },
        update: {
          summary: data.summary,
          skills: data.skills,
          experience: data.experience,
          education: data.education,
          certifications: data.certifications,
          careerGoals: data.careerGoals,
          location: data.location,
          remotePreference: data.remotePreference,
          salaryExpectation: data.salaryExpectation,
        },
        create: {
          userId,
          summary: data.summary,
          skills: data.skills,
          experience: data.experience,
          education: data.education,
          certifications: data.certifications,
          careerGoals: data.careerGoals,
          location: data.location,
          remotePreference: data.remotePreference,
          salaryExpectation: data.salaryExpectation,
        },
      });

      if (data.persona) {
        await tx.persona.create({
          data: {
            userId,
            profileId: profile.id,
            name: data.persona.name || 'Default',
            targetRole: data.persona.targetRole || data.careerGoals?.targetRole || '',
            experienceLevel: data.persona.experienceLevel || 'MID',
            skills: data.skills || [],
            isDefault: true,
          },
        });
      }

      if (data.preferences) {
        await tx.userPreferences.upsert({
          where: { userId },
          update: data.preferences,
          create: { userId, ...data.preferences },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });

      this.logger.log(`Intake completed for user ${userId}`);
      return { completed: true, profileId: profile.id };
    });
  }

  async getIntakeStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    });
    return { onboardingCompleted: user?.onboardingCompleted || false };
  }
}
