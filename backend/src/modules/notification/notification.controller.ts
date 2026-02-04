import {
  Controller,
  Get,
  Put,
  Delete,
  UseGuards,
  Request,
  Param,
  Query,
  UsePipes,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { paginationSchema } from '../../dto/common/pagination.zod';
import type { PaginationQueryDto } from '../../dto/common/pagination.zod';
import { ZodValidationPipe } from '../../pipes/zod.pipe';

@Controller('api/notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(paginationSchema))
  async getNotifications(@Request() req, @Query() query: PaginationQueryDto) {
    return this.notificationService.getNotifications(req.user.id, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getNotificationById(@Request() req, @Param('id') id: string) {
    return this.notificationService.getNotificationById(req.user.id, id);
  }

  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteNotification(@Request() req, @Param('id') id: string) {
    return this.notificationService.deleteNotification(req.user.id, id);
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  async clearNotifications(@Request() req, @Body() body: { readOnly?: boolean }) {
    return this.notificationService.clearNotifications(req.user.id, body.readOnly);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.id);
  }
}
