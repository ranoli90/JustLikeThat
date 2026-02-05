# =============================================================================
# Apply-as-a-Service Platform - Sprint 38 Outputs
# =============================================================================

# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.networking.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.networking.vpc_cidr_block
}

output "subnet_ids" {
  description = "List of subnet IDs"
  value       = module.networking.subnet_ids
}

output "subnet_public_ids" {
  description = "List of public subnet IDs"
  value       = module.networking.subnet_public_ids
}

output "subnet_private_ids" {
  description = "List of private subnet IDs"
  value       = module.networking.subnet_private_ids
}

# Security Group Outputs
output "security_group_id" {
  description = "ID of the security group"
  value       = module.networking.security_group_id
}

output "security_group_name" {
  description = "Name of the security group"
  value       = module.networking.security_group_name
}

# Compute Outputs
output "instance_ids" {
  description = "List of EC2 instance IDs"
  value       = module.compute.instance_ids
}

output "instance_ips" {
  description = "List of instance public IPs"
  value       = module.compute.instance_ips
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = module.compute.launch_template_id
}

output "asg_name" {
  description = "Name of the auto-scaling group"
  value       = module.compute.asg_name
}

# Database Outputs
output "database_endpoint" {
  description = "Database endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "database_port" {
  description = "Database port"
  value       = module.database.port
  sensitive   = true
}

output "database_arn" {
  description = "Database ARN"
  value       = module.database.arn
}

output "database_name" {
  description = "Database name"
  value       = module.database.name
  sensitive   = true
}

# Cache Outputs
output "cache_endpoint" {
  description = "Cache cluster endpoint"
  value       = module.cache.endpoint
  sensitive   = true
}

output "cache_port" {
  description = "Cache cluster port"
  value       = module.cache.port
}

output "cache_arn" {
  description = "Cache cluster ARN"
  value       = module.cache.arn
}

# Queue Outputs
output "queue_url" {
  description = "SQS queue URL"
  value       = module.queue.queue_url
}

output "queue_arn" {
  description = "SQS queue ARN"
  value       = module.queue.queue_arn
}

output "queue_name" {
  description = "SQS queue name"
  value       = module.queue.queue_name
}

# Vault Outputs
output "vault_secrets_path" {
  description = "Path to secrets in Vault"
  value       = module.vault_integration.secrets_path
}

output "vault_dynamic_db_creds" {
  description = "Database dynamic credentials path"
  value       = module.vault_integration.dynamic_db_creds_path
  sensitive   = true
}

# Application Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.compute.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = module.compute.alb_zone_id
}

output "dashboard_url" {
  description = "Application dashboard URL"
  value       = "https://${var.environment}.${var.app_name}.io"
}
