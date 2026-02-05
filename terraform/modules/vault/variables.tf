# =============================================================================
# Vault Module Variables - Sprint 38
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

# KV Engine
variable "enable_kv_engine" {
  description = "Enable KV secrets engine"
  type        = bool
  default     = true
}

variable "kv_mount_path" {
  description = "KV mount path"
  type        = string
  default     = "secret"
}

variable "kv_version" {
  description = "KV version (1 or 2)"
  type        = number
  default     = 2
}

# Database Engine
variable "enable_database_engine" {
  description = "Enable database secrets engine"
  type        = bool
  default     = true
}

variable "database_engine_path" {
  description = "Database engine path"
  type        = string
  default     = "database"
}

# Transit Engine
variable "enable_transit_engine" {
  description = "Enable transit secrets engine for encryption"
  type        = bool
  default     = true
}

variable "allow_key_deletion" {
  description = "Allow deletion of encryption keys"
  type        = bool
  default     = false
}

variable "exportable_keys" {
  description = "Exportable keys"
  type        = bool
  default     = false
}

variable "key_rotation_period" {
  description = "Key rotation period"
  type        = string
  default     = "30d"
}

# Database credentials
variable "database_host" {
  description = "Database host"
  type        = string
  default     = ""
}

variable "database_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "database_username" {
  description = "Database username"
  type        = string
  default     = "admin"
}

variable "database_password" {
  description = "Database password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "apply_as_a_service"
}

# Cache credentials
variable "cache_host" {
  description = "Cache host"
  type        = string
  default     = ""
}

variable "cache_port" {
  description = "Cache port"
  type        = number
  default     = 6379
}

variable "cache_password" {
  description = "Cache password"
  type        = string
  default     = ""
  sensitive   = true
}

# Application secrets
variable "application_secrets" {
  description = "Application secrets map"
  type        = map(string)
  default     = {}
  sensitive   = true
}

# JWT secrets
variable "jwt_secret_key" {
  description = "JWT secret key"
  type        = string
  default     = ""
  sensitive   = true
}

# Encryption keys
variable "encryption_master_key" {
  description = "Encryption master key"
  type        = string
  default     = ""
  sensitive   = true
}

# Lease settings
variable "default_lease_ttl_seconds" {
  description = "Default lease TTL in seconds"
  type        = number
  default     = 3600
}

variable "max_lease_ttl_seconds" {
  description = "Max lease TTL in seconds"
  type        = number
  default     = 86400
}

# Kubernetes Auth
variable "enable_kubernetes_auth" {
  description = "Enable Kubernetes auth method"
  type        = bool
  default     = true
}

variable "kubernetes_host" {
  description = "Kubernetes API host"
  type        = string
  default     = ""
}

variable "kubernetes_ca_cert" {
  description = "Kubernetes CA certificate"
  type        = string
  default     = ""
}

variable "token_reviewer_jwt" {
  description = "Token reviewer JWT"
  type        = string
  default     = ""
}

variable "kubernetes_issuer" {
  description = "Kubernetes token issuer"
  type        = string
  default     = "kubernetes/serviceaccount"
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "default"
}

variable "app_service_accounts" {
  description = "Service accounts allowed to access app role"
  type        = list(string)
  default     = ["default"]
}

variable "admin_service_accounts" {
  description = "Service accounts allowed to access admin role"
  type        = list(string)
  default     = ["admin"]
}

# AWS Auth
variable "enable_aws_auth" {
  description = "Enable AWS auth method"
  type        = bool
  default     = false
}

variable "aws_account_ids" {
  description = "Allowed AWS account IDs"
  type        = list(string)
  default     = []
}

# Token settings
variable "token_ttl" {
  description = "Token TTL in seconds"
  type        = number
  default     = 3600
}

variable "token_max_ttl" {
  description = "Token max TTL in seconds"
  type        = number
  default     = 43200
}

# Rotation
variable "enable_rotation_policy" {
  description = "Enable rotation policy"
  type        = bool
  default     = true
}

variable "rotation_period" {
  description = "Rotation period"
  type        = string
  default     = "24h"
}

variable "rotation_schedule" {
  description = "Rotation schedule (cron)"
  type        = string
  default     = "0 0 * * *"
}

# Audit
variable "enable_audit_socket" {
  description = "Enable audit socket"
  type        = bool
  default     = false
}

variable "audit_log_path" {
  description = "Audit log file path"
  type        = string
  default     = "/var/log/vault/audit.log"
}

variable "audit_socket_address" {
  description = "Audit socket address"
  type        = string
  default     = "127.0.0.1:1234"
}
