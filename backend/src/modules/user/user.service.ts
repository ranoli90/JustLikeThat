import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { UpdateUserDto } from '../../dto/user/update-user.dto';
import { UpdateUserPreferencesDto } from '../../dto/user/update-preferences.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
  ) {}

  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateCurrentUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getCurrentUser(userId);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async getCurrentUserPreferences(userId: string): Promise<UserPreferences> {
    const preferences = await this.preferencesRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }
    return preferences;
  }

  async updateCurrentUserPreferences(
    userId: string,
    updatePreferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferences> {
    const preferences = await this.getCurrentUserPreferences(userId);
    Object.assign(preferences, updatePreferencesDto);
    return this.preferencesRepository.save(preferences);
  }
}
