import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateResumeDto {
  @IsString()
  fileUrl: string;

  @IsOptional()
  fileSize?: number;

  @IsOptional()
  parsedData?: any;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
