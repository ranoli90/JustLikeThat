import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'resumes');

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async upload(userId: string, file: Express.Multer.File) {
    const fileName = `${userId}-${Date.now()}-${file.originalname}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        fileUrl: `/uploads/resumes/${fileName}`,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    this.logger.log(`Resume uploaded for user ${userId}: ${resume.id}`);
    return resume;
  }

  async findAll(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }

  async setDefault(userId: string, id: string) {
    await this.prisma.resume.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
    return this.prisma.resume.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async remove(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) throw new NotFoundException('Resume not found');

    const filePath = path.join(process.cwd(), resume.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.resume.delete({ where: { id } });
    this.logger.log(`Resume deleted for user ${userId}: ${id}`);
    return { deleted: true };
  }
}
