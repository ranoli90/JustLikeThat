# =============================================================================
# Cache Module Variables - Sprint 38
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

variable "subnet_ids" {
  description = "List of subnet IDs"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID"
  type        = string
}

# Cluster configuration
variable "cluster_mode_enabled" {
  description = "Enable Redis cluster mode"
  type        = bool
  default     = true
}

variable "engine" {
  description = "Cache engine"
  type        = string
  default     = "redis"
}

variable "engine_version" {
  description = "Cache engine version"
  type        = string
  default     = "7.0"
}

variable "node_type" {
  description = "Cache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "num_node_groups" {
  description = "Number of node groups (shards)"
  type        = number
  default     = 1
}

variable "replicas_per_node_group" {
  description = "Replicas per node group"
  type        = number
  default     = 1
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (non-clustered mode)"
  type        = number
  default     = 2
}

variable "port" {
  description = "Cache port"
  type        = number
  default     = 6379
}

# Performance tuning
variable "parameter_group_family" {
  description = "Parameter group family"
  type        = string
  default     = "redis7.0"
}

variable "maxmemory_policy" {
  description = "Max memory policy"
  type        = string
  default     = "volatile-lru"
}

variable "timeout" {
  description = "Timeout in milliseconds"
  type        = number
  default     = 300
}

variable "tcp_keepalive" {
  description = "TCP keepalive in seconds"
  type        = number
  default     = 300
}

variable "tcp_backlog" {
  description = "TCP backlog"
  type        = number
  default     = 511
}

variable "maxclients" {
  description = "Max clients"
  type        = number
  default     = 65000
}

# Authentication
variable "enable_auth" {
  description = "Enable authentication"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "Authentication token"
  type        = string
  default     = ""
  sensitive   = true
}

# User-based access
variable "enable_user_based_access" {
  description = "Enable user-based access control"
  type        = bool
  default     = false
}

variable "app_user_password" {
  description = "App user password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "app_user_access_string" {
  description = "App user access string"
  type        = string
  default     = "on ~* +@read"
}

variable "readonly_user_password" {
  description = "Readonly user password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "readonly_user_access_string" {
  description = "Readonly user access string"
  type        = string
  default     = "~* +@read"
}

# High availability
variable "automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

# Encryption
variable "encryption_enabled" {
  description = "Enable at-rest encryption"
  type        = bool
  default     = true
}

variable "transit_encryption_enabled" {
  description = "Enable in-transit encryption"
  type        = bool
  default     = true
}

# Backup
variable "snapshot_retention_limit" {
  description = "Snapshot retention limit"
  type        = number
  default     = 7
}

variable "snapshot_window" {
  description = "Snapshot window"
  type        = string
  default     = "05:00-06:00"
}

# Maintenance
variable "maintenance_window" {
  description = "Maintenance window"
  type        = string
  default     = "sun:06:00-sun:07:00"
}

# Global replication
variable "enable_global_replication" {
  description = "Enable global replication"
  type        = bool
  default     = false
}

# Vault integration
variable "enable_vault_integration" {
  description = "Enable Vault integration"
  type        = bool
  default     = true
}

variable "vault_mount_path" {
  description = "Vault mount path"
  type        = string
  default     = "secret"
}

# Alarms
variable "max_connections" {
  description = "Max connections threshold"
  type        = number
  default     = 10000
}

variable "alarm_actions" {
  description = "ARNs for alarm actions"
  type        = list(string)
  default     = []
}
