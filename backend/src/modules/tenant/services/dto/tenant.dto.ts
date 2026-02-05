import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Enum value lists for validation
const TENANT_STATUS_VALUES = ['ACTIVE', 'SUSPENDED', 'PENDING', 'DELETED'] as const;
const PLAN_TYPE_VALUES = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'] as const;
const DATA_RESIDENCY_VALUES = ['US', 'EU', 'APAC'] as const;
const SLA_LEVEL_VALUES = ['SILVER', 'GOLD', 'PLATINUM'] as const;

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  plan?: typeof PLAN_TYPE_VALUES[number];

  @IsOptional()
  @IsString()
  dataResidency?: typeof DATA_RESIDENCY_VALUES[number];

  @IsOptional()
  @IsString()
  enterpriseId?: string;

  @IsOptional()
  @IsString()
  resourcePool?: string;

  @IsOptional()
  @IsBoolean()
  dedicatedSupport?: boolean;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  plan?: typeof PLAN_TYPE_VALUES[number];

  @IsOptional()
  @IsString()
  status?: typeof TENANT_STATUS_VALUES[number];

  @IsOptional()
  @IsString()
  dataResidency?: typeof DATA_RESIDENCY_VALUES[number];

  @IsOptional()
  @IsString()
  enterpriseId?: string;

  @IsOptional()
  @IsString()
  resourcePool?: string;
}

export class TenantQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  status?: typeof TENANT_STATUS_VALUES[number];

  @IsOptional()
  @IsString()
  plan?: typeof PLAN_TYPE_VALUES[number];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UpdateTenantStatusDto {
  status: typeof TENANT_STATUS_VALUES[number];
}

export class UpdateTenantPlanDto {
  plan: typeof PLAN_TYPE_VALUES[number];
}

export class EnterpriseConfigDto {
  @IsOptional()
  @IsString()
  enterpriseId?: string;

  @IsOptional()
  @IsString()
  resourcePool?: string;

  @IsOptional()
  @IsString()
  slaLevel?: typeof SLA_LEVEL_VALUES[number];

  @IsOptional()
  @IsBoolean()
  dedicatedSupport?: boolean;
}
