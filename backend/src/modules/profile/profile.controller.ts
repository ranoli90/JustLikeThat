import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  UsePipes,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { ZodValidationPipe } from '../../pipes/zod.pipe';
import { updateProfileSchema } from '../../dto/profile/update-profile.zod';
import type { UpdateProfileDto } from '../../dto/profile/update-profile.zod';
import { createPersonaSchema, updatePersonaSchema } from '../../dto/profile/create-persona.zod';
import type { CreatePersonaDto, UpdatePersonaType } from '../../dto/profile/create-persona.zod';
import { uploadResumeSchema } from '../../dto/resume/upload-resume.zod';
import type { UploadResumeDto } from '../../dto/resume/upload-resume.zod';
import { paginationSchema } from '../../dto/common/pagination.zod';
import type { PaginationQueryDto } from '../../dto/common/pagination.zod';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/profiles')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUserProfile(@Request() req) {
    return this.profileService.getCurrentUserProfile(req.user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  async updateCurrentUserProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateCurrentUserProfile(req.user.id, updateProfileDto);
  }

  @Get('resumes')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(paginationSchema))
  async getCurrentUserResumes(@Request() req, @Query() query: PaginationQueryDto) {
    return this.profileService.getCurrentUserResumes(req.user.id, query);
  }

  @Get('resumes/:id')
  @UseGuards(JwtAuthGuard)
  async getResumeById(@Request() req, @Param('id') id: string) {
    return this.profileService.getResumeById(req.user.id, id);
  }

  @Post('resumes')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@Request() req, @UploadedFile() file: any) {
    const uploadDto: UploadResumeDto = {
      file,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
    };
    return this.profileService.uploadResume(req.user.id, uploadDto);
  }

  @Delete('resumes/:id')
  @UseGuards(JwtAuthGuard)
  async deleteResume(@Request() req, @Param('id') id: string) {
    return this.profileService.deleteResume(req.user.id, id);
  }

  @Post('resumes/:id/parse')
  @UseGuards(JwtAuthGuard)
  async parseResume(@Request() req, @Param('id') id: string) {
    return this.profileService.parseResume(req.user.id, id);
  }

  @Get('personas')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(paginationSchema))
  async getCurrentUserPersonas(@Request() req, @Query() query: PaginationQueryDto) {
    return this.profileService.getCurrentUserPersonas(req.user.id, query);
  }

  @Get('personas/:id')
  @UseGuards(JwtAuthGuard)
  async getPersonaById(@Request() req, @Param('id') id: string) {
    return this.profileService.getPersonaById(req.user.id, id);
  }

  @Post('personas')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(createPersonaSchema))
  async createPersona(@Request() req, @Body() createPersonaDto: CreatePersonaDto) {
    return this.profileService.createPersona(req.user.id, createPersonaDto);
  }

  @Put('personas/:id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(updatePersonaSchema))
  async updatePersona(@Request() req, @Param('id') id: string, @Body() updatePersonaDto: UpdatePersonaType) {
    return this.profileService.updatePersona(req.user.id, id, updatePersonaDto);
  }

  @Delete('personas/:id')
  @UseGuards(JwtAuthGuard)
  async deletePersona(@Request() req, @Param('id') id: string) {
    return this.profileService.deletePersona(req.user.id, id);
  }
}
