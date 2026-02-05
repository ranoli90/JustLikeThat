# =============================================================================
# Apply-as-a-Service Platform - Sprint 38 Variables
# =============================================================================

# Network Variables
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Compute Variables
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "desired_count" {
  description = "Desired number of instances"
  type        = number
  default     = 2
}

variable "max_count" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "min_count" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

# Database Variables
variable "db_engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "db_engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Database allocated storage in GB"
  type        = number
  default     = 100
}

# Cache Variables
variable "cache_node_type" {
  description = "Cache node type"
  type        = string
  default     = "cache.t3.medium"
}

# Queue Variables
variable "queue_visibility_timeout" {
  description = "SQS queue visibility timeout in seconds"
  type        = number
  default     = 300
}

# Vault Variables
variable "vault_address" {
  description = "Vault server address"
  type        = string
  default     = "http://127.0.0.1:8200"
}

variable "vault_token" {
  description = "Vault token"
  type        = string
  default     = ""
  sensitive   = true
}

# Environment Configuration
variable "environment_config" {
  description = "Environment-specific configuration"
  type = object({
    dev = object({
      instance_type  = string
      desired_count  = number
      db_instance_class = string
    })
    staging = object({
      instance_type  = string
      desired_count  = number
      db_instance_class = string
    })
    prod = object({
      instance_type  = string
      desired_count  = number
      db_instance_class = string
    })
  })
  default = {
    dev = {
      instance_type    = "t3.medium"
      desired_count    = 2
      db_instance_class = "db.t3.medium"
    }
    staging = {
      instance_type    = "t3.large"
      desired_count    = 3
      db_instance_class = "db.t3.large"
    }
    prod = {
      instance_type    = "t3.xlarge"
      desired_count    = 5
      db_instance_class = "db.r5.large"
    }
  }
}
