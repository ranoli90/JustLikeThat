# =============================================================================
# Database Module Variables - Sprint 38
# =============================================================================

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "apply-as-a-service"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "account_id" {
  description = "AWS account ID"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

# Database settings
variable "engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "15.4"
}

variable "instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "storage_type" {
  description = "Storage type (gp2, gp3, io1)"
  type        = string
  default     = "gp3"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "availability_zone" {
  description = "Availability zone for single AZ deployment"
  type        = string
  default     = "us-east-1a"
}

# Credentials
variable "master_username" {
  description = "Master username"
  type        = string
  default     = "admin"
}

variable "master_password" {
  description = "Master password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "manage_master_password" {
  description = "Let AWS manage master password"
  type        = bool
  default     = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "apply_as_a_service"
}

# Performance tuning
variable "parameter_group_family" {
  description = "Parameter group family"
  type        = string
  default     = "postgres15"
}

variable "shared_buffers" {
  description = "Shared buffers setting"
  type        = string
  default     = "131072" # 512MB
}

variable "work_mem" {
  description = "Work memory setting"
  type        = string
  default     = "4096"
}

variable "maintenance_work_mem" {
  description = "Maintenance work memory"
  type        = string
  default     = "65536"
}

variable "effective_cache_size" {
  description = "Effective cache size"
  type        = string
  default     = "393216"
}

variable "max_connections" {
  description = "Max connections"
  type        = string
  default     = "300"
}

# Backup and maintenance
variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "Sun:05:00-Sun:06:00"
}

variable "auto_minor_version_upgrade" {
  description = "Auto minor version upgrade"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = false
}

# Monitoring
variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "performance_insights_retention" {
  description = "Performance Insights retention period"
  type        = number
  default     = 731
}

variable "enable_enhanced_monitoring" {
  description = "Enable enhanced monitoring"
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "Monitoring interval in seconds"
  type        = number
  default     = 60
}

# Logging
variable "log_min_duration_statement" {
  description = "Log min duration statement"
  type        = string
  default     = "1000"
}

# Read replicas
variable "replica_count" {
  description = "Number of read replicas"
  type        = number
  default     = 0
}

variable "replica_instance_class" {
  description = "Read replica instance class"
  type        = string
  default     = "db.t3.medium"
}

# Vault integration
variable "enable_vault_integration" {
  description = "Enable Vault dynamic secrets"
  type        = bool
  default     = true
}

variable "vault_backend_path" {
  description = "Vault backend path"
  type        = string
  default     = "database"
}

variable "vault_default_ttl" {
  description = "Vault default TTL for dynamic secrets"
  type        = number
  default     = 86400
}

variable "vault_max_ttl" {
  description = "Vault max TTL for dynamic secrets"
  type        = number
  default     = 172800
}

# Alarms
variable "alarm_actions" {
  description = "ARNs for alarm actions"
  type        = list(string)
  default     = []
}

# Timeouts
variable "db_create_timeout" {
  description = "DB instance create timeout"
  type        = string
  default     = "60m"
}

variable "db_update_timeout" {
  description = "DB instance update timeout"
  type        = string
  default     = "60m"
}

variable "db_delete_timeout" {
  description = "DB instance delete timeout"
  type        = string
  default     = "40m"
}
