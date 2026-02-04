import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsOptional()
  experiences?: any[];

  @IsArray()
  @IsOptional()
  education?: any[];

  @IsArray()
  @IsOptional()
  skills?: any[];

  @IsArray()
  @IsOptional()
  certifications?: any[];

  @IsArray()
  @IsOptional()
  projects?: any[];

  @IsArray()
  @IsOptional()
  languages?: any[];
}
