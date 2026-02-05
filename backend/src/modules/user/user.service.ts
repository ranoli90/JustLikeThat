import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';
import { UpdateUserDto } from '../../dto/user/update-user.dto';
import { UpdateUserPreferencesDto } from '../../dto/user/update-preferences.dto';

/**
 * Service for managing user profiles and preferences
 */
@Injectable()
export class UserService {
  /**
   * Creates a new UserService instance
   * @param userRepository - Repository for user entities
   * @param preferencesRepository - Repository for user preferences
   */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
  ) {}

  /**
   * Retrieves the current user's profile
   * @param userId - The user ID
   * @returns The user entity
   * @throws NotFoundException if user not found
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Updates the current user's profile
   * @param userId - The user ID
   * @param updateUserDto - The update data
   * @returns The updated user entity
   */
  async updateCurrentUser(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getCurrentUser(userId);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Retrieves the current user's preferences
   * @param userId - The user ID
   * @returns The user preferences entity
   * @throws NotFoundException if preferences not found
   */
  async getCurrentUserPreferences(userId: string): Promise<UserPreferences> {
    const preferences = await this.preferencesRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!preferences) {
      throw new NotFoundException('User preferences not found');
    }
    return preferences;
  }

  /**
   * Updates the current user's preferences
   * @param userId - The user ID
   * @param updatePreferencesDto - The preferences update data
   * @returns The updated user preferences entity
   */
  async updateCurrentUserPreferences(
    userId: string,
    updatePreferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferences> {
    const preferences = await this.getCurrentUserPreferences(userId);
    Object.assign(preferences, updatePreferencesDto);
    return this.preferencesRepository.save(preferences);
  }
}
