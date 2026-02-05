import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @IsString()
  path: string;

  @IsString()
  method: string;

  @IsString()
  targetService: string;

  @IsOptional()
  @IsString()
  targetPath?: string;

  @IsOptional()
  @IsArray()
  plugins?: Array<{
    name: string;
    config: Record<string, any>;
    enabled: boolean;
  }>;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  timeout?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  retries?: number;

  @IsOptional()
  @IsBoolean()
  stripPrefix?: boolean;

  @IsOptional()
  @IsBoolean()
  preserveHost?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  priority?: number;
}

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  targetService?: string;

  @IsOptional()
  @IsString()
  targetPath?: string;

  @IsOptional()
  @IsArray()
  plugins?: Array<{
    name: string;
    config: Record<string, any>;
    enabled: boolean;
  }>;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  timeout?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  retries?: number;

  @IsOptional()
  @IsBoolean()
  stripPrefix?: boolean;

  @IsOptional()
  @IsBoolean()
  preserveHost?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  priority?: number;
}

export class RouteQueryDto {
  @IsOptional()
  @IsString()
  targetService?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  skip?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  take?: number;
}

export class ScalingPolicyDto {
  @IsString()
  serviceName: string;

  @IsNumber()
  @Min(1)
  minReplicas: number;

  @IsNumber()
  @Min(1)
  maxReplicas: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetCpu?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetMemory?: number;

  @IsOptional()
  @IsNumber()
  targetRequestsPerSecond?: number;

  @IsOptional()
  @IsNumber()
  @Min(60)
  cooldownSeconds?: number;
}
