import { IsString, IsUrl, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
