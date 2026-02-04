import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';

export class UpdateUserPreferencesDto {
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  remotePreference?: string; // 'remote', 'hybrid', 'onsite'

  @IsArray()
  @IsOptional()
  jobTypes?: string[]; // ['full_time', 'part_time', 'contract']

  @IsNumber()
  @IsOptional()
  minSalary?: number;

  @IsNumber()
  @IsOptional()
  maxSalary?: number;

  @IsArray()
  @IsOptional()
  industries?: string[];

  @IsArray()
  @IsOptional()
  skillKeywords?: string[];
}
