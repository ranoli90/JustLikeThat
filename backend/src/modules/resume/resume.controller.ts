import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Put,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('resume')
@UseGuards(JwtAuthGuard)
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('resume'))
  async upload(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.resumeService.upload(req.user.id, file);
  }

  @Get('list')
  async findAll(@Request() req: any) {
    return this.resumeService.findAll(req.user.id);
  }

  @Get(':id')
  async findById(@Request() req: any, @Param('id') id: string) {
    return this.resumeService.findById(req.user.id, id);
  }

  @Put(':id/default')
  async setDefault(@Request() req: any, @Param('id') id: string) {
    return this.resumeService.setDefault(req.user.id, id);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.resumeService.remove(req.user.id, id);
  }
}
