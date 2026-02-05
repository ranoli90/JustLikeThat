# =============================================================================
# Queue Module Variables - Sprint 38
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

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "queue_name" {
  description = "Queue name"
  type        = string
}

# Queue configuration
variable "fifo_queue" {
  description = "Enable FIFO queue"
  type        = bool
  default     = true
}

variable "content_based_deduplication" {
  description = "Enable content-based deduplication"
  type        = bool
  default     = true
}

variable "visibility_timeout" {
  description = "Visibility timeout in seconds"
  type        = number
  default     = 300
}

variable "message_retention_seconds" {
  description = "Message retention in seconds"
  type        = number
  default     = 86400
}

variable "receive_wait_time_seconds" {
  description = "Receive wait time in seconds"
  type        = number
  default     = 20
}

# Dead Letter Queue
variable "max_receive_count" {
  description = "Max receive count before moving to DLQ"
  type        = number
  default     = 3
}

variable "dlq_retention_seconds" {
  description = "DLQ message retention in seconds"
  type        = number
  default     = 1209600
}

# Priority queues
variable "enable_priority_queues" {
  description = "Enable priority queues"
  type        = bool
  default     = false
}

# Encryption
variable "sse_enabled" {
  description = "Enable server-side encryption"
  type        = bool
  default     = true
}

# Access control
variable "allowed_account_ids" {
  description = "Allowed account IDs for cross-account access"
  type        = list(string)
  default     = []
}

# Alarms
variable "alarm_threshold" {
  description = "Alarm threshold for queue depth"
  type        = number
  default     = 1000
}

variable "max_age_threshold" {
  description = "Max age threshold in seconds"
  type        = number
  default     = 3600
}

variable "alarm_actions" {
  description = "ARNs for alarm actions"
  type        = list(string)
  default     = []
}

variable "create_dashboard" {
  description = "Create CloudWatch dashboard"
  type        = bool
  default     = true
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
