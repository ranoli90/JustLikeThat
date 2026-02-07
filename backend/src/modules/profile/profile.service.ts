import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: { personas: true },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.candidateProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getPersonas(userId: string) {
    return this.prisma.persona.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async createPersona(userId: string, data: any) {
    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found. Complete onboarding first.');
    return this.prisma.persona.create({
      data: { userId, profileId: profile.id, ...data },
    });
  }

  async updatePersona(userId: string, personaId: string, data: any) {
    const persona = await this.prisma.persona.findFirst({ where: { id: personaId, userId } });
    if (!persona) throw new NotFoundException('Persona not found');
    return this.prisma.persona.update({ where: { id: personaId }, data });
  }

  async deletePersona(userId: string, personaId: string) {
    const persona = await this.prisma.persona.findFirst({ where: { id: personaId, userId } });
    if (!persona) throw new NotFoundException('Persona not found');
    await this.prisma.persona.delete({ where: { id: personaId } });
    return { deleted: true };
  }
}
