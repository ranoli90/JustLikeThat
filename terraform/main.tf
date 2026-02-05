# =============================================================================
# Apply-as-a-Service Platform - Sprint 38 DevOps & Infrastructure
# Terraform Backend Configuration
# =============================================================================

terraform {
  backend "s3" {
    bucket         = "apply-as-a-service-terraform-state"
    key            = "global/s3/backend.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-locking"
  }
}

# =============================================================================
# Provider Configuration
# =============================================================================

provider "aws" {
  alias  = "aws"
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "apply-as-a-service"
      Environment = var.environment
      ManagedBy   = "terraform"
      Sprint      = "38"
    }
  }
}

provider "google" {
  alias  = "google"
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "azurerm" {
  alias                   = "azurerm"
  subscription_id         = var.azure_subscription_id
  tenant_id               = var.azure_tenant_id
  client_id               = var.azure_client_id
  client_secret           = var.azure_client_secret
  features {}
}

# =============================================================================
# Variables
# =============================================================================

variable "aws_region" {
  description = "AWS Region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "apply-as-a-service"
}

variable "gcp_region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "azure_subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  default     = ""
}

variable "azure_tenant_id" {
  description = "Azure Tenant ID"
  type        = string
  default     = ""
}

variable "azure_client_id" {
  description = "Azure Client ID"
  type        = string
  default     = ""
}

variable "azure_client_secret" {
  description = "Azure Client Secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "apply-as-a-service"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod", "sandbox", "dr"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod, sandbox, dr"
  }
}

# =============================================================================
# Networking Module
# =============================================================================

module "networking" {
  source = "./modules/networking"

  providers = {
    aws = aws.aws
  }

  environment      = var.environment
  app_name         = var.app_name
  cidr_block       = var.vpc_cidr
  availability_zones = var.availability_zones

  tags = {
    Environment = var.environment
    Project     = var.app_name
  }
}

# =============================================================================
# Compute Module
# =============================================================================

module "compute" {
  source = "./modules/compute"

  providers = {
    aws = aws.aws
  }

  environment    = var.environment
  app_name       = var.app_name
  vpc_id         = module.networking.vpc_id
  subnet_ids     = module.networking.subnet_ids
  instance_type  = var.instance_type
  desired_count  = var.desired_count
  max_count      = var.max_count
  min_count      = var.min_count

  depends_on = [module.networking]
}

# =============================================================================
# Database Module
# =============================================================================

module "database" {
  source = "./modules/database"

  providers = {
    aws = aws.aws
  }

  environment  = var.environment
  app_name     = var.app_name
  vpc_id       = module.networking.vpc_id
  subnet_ids   = module.networking.subnet_ids
  engine       = var.db_engine
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class
  allocated_storage = var.db_allocated_storage

  depends_on = [module.networking]
}

# =============================================================================
# Cache Module
# =============================================================================

module "cache" {
  source = "./modules/cache"

  providers = {
    aws = aws.aws
  }

  environment  = var.environment
  app_name     = var.app_name
  vpc_id       = module.networking.vpc_id
  subnet_ids   = module.networking.subnet_ids
  node_type    = var.cache_node_type

  depends_on = [module.networking]
}

# =============================================================================
# Queue Module
# =============================================================================

module "queue" {
  source = "./modules/queue"

  providers = {
    aws = aws.aws
  }

  environment  = var.environment
  app_name     = var.app_name
  queue_name   = "${var.app_name}-${var.environment}"
  visibility_timeout = var.queue_visibility_timeout
}

# =============================================================================
# Vault Integration
# =============================================================================

module "vault_integration" {
  source = "./modules/vault"

  providers = {
    aws = aws.aws
  }

  environment    = var.environment
  app_name      = var.app_name
  vault_address = var.vault_address
  vault_token   = var.vault_token

  depends_on = [module.database, module.cache]
}

# =============================================================================
# Outputs
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "subnet_ids" {
  description = "List of subnet IDs"
  value       = module.networking.subnet_ids
}

output "instance_ids" {
  description = "List of instance IDs"
  value       = module.compute.instance_ids
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "cache_endpoint" {
  description = "Cache cluster endpoint"
  value       = module.cache.endpoint
  sensitive   = true
}

output "queue_url" {
  description = "SQS queue URL"
  value       = module.queue.queue_url
}

output "vault_secrets_path" {
  description = "Vault secrets path"
  value       = module.vault_integration.secrets_path
}
