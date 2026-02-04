import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { SignupDto } from '../../dto/auth/signup.dto';
import { LoginDto } from '../../dto/auth/login.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CandidateProfile } from '../../entities/candidate-profile.entity';
import { UserPreferences } from '../../entities/user-preferences.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CandidateProfile)
    private profileRepository: Repository<CandidateProfile>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ accessToken: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email: signupDto.email } });
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // Create user
    const user = this.userRepository.create({
      ...signupDto,
      passwordHash: hashedPassword,
    });
    await this.userRepository.save(user);

    // Create candidate profile
    const profile = this.profileRepository.create({
      user,
    });
    await this.profileRepository.save(profile);

    // Create user preferences
    const preferences = this.preferencesRepository.create({
      user,
      jobTitle: '',
    });
    await this.preferencesRepository.save(preferences);

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h',
    });

    return { accessToken };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h',
    });

    return { accessToken };
  }
}
