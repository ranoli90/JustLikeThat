# =============================================================================
# Compute Module Variables - Sprint 38
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

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0c02fb55956c7d316" # Amazon Linux 2
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "instance_types" {
  description = "List of instance types for mixed instances policy"
  type        = list(string)
  default     = ["t3.medium", "t3.large", "m5.medium"]
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

variable "on_demand_percentage" {
  description = "Percentage of on-demand instances above base capacity"
  type        = number
  default     = 70
}

# Zero-downtime deployment settings
variable "health_check_grace_period" {
  description = "Health check grace period in seconds"
  type        = number
  default     = 300
}

variable "deregistration_delay" {
  description = "Deregistration delay in seconds"
  type        = number
  default     = 30
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 10
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "healthy_threshold_count" {
  description = "Healthy threshold count"
  type        = number
  default     = 2
}

variable "unhealthy_threshold_count" {
  description = "Unhealthy threshold count"
  type        = number
  default     = 5
}

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "root_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 50
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

variable "enable_lifecycle_hooks" {
  description = "Enable lifecycle hooks for zero-downtime deployments"
  type        = bool
  default     = true
}

variable "lifecycle_hook_timeout" {
  description = "Lifecycle hook timeout in seconds"
  type        = number
  default     = 300
}

# ALB settings
variable "alb_internal" {
  description = "Create internal ALB"
  type        = bool
  default     = false
}

variable "alb_log_bucket" {
  description = "S3 bucket for ALB logs"
  type        = string
  default     = ""
}

variable "enable_https" {
  description = "Enable HTTPS listener"
  type        = bool
  default     = true
}

variable "alb_ssl_policy" {
  description = "ALB SSL policy"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

# Blue-Green Deployment settings
variable "enable_blue_green_deployment" {
  description = "Enable blue-green deployment"
  type        = bool
  default     = true
}

variable "enable_canary_deployment" {
  description = "Enable canary deployment"
  type        = bool
  default     = true
}

# Auto Scaling policies
variable "cpu_target_value" {
  description = "CPU target value for scaling"
  type        = number
  default     = 70
}

variable "memory_target_value" {
  description = "Memory target value for scaling"
  type        = number
  default     = 80
}

# Scheduled scaling
variable "enable_scheduled_scaling" {
  description = "Enable scheduled scaling"
  type        = bool
  default     = false
}

variable "scale_up_schedule" {
  description = "Cron expression for scale up"
  type        = string
  default     = "0 8 * * *"
}

variable "scale_down_schedule" {
  description = "Cron expression for scale down"
  type        = string
  default     = "0 18 * * *"
}

# Notifications
variable "notification_email" {
  description = "Email for ASG notifications"
  type        = string
  default     = ""
}

# Tags
variable "asg_tags" {
  description = "Tags for ASG instances"
  type = map(string)
  default = {
    "Environment" = "dev"
    "Project"     = "apply-as-a-service"
    "ManagedBy"   = "terraform"
    "Sprint"      = "38"
  }
}
