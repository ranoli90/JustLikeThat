# =============================================================================
# Database Module Outputs - Sprint 38
# =============================================================================

output "endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "port" {
  description = "Database port"
  value       = aws_db_instance.main.port
  sensitive   = true
}

output "arn" {
  description = "Database ARN"
  value       = aws_db_instance.main.arn
}

output "name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
  sensitive   = true
}

output "instance_id" {
  description = "Database instance ID"
  value       = aws_db_instance.main.id
}

output "instance_arn" {
  description = "Database instance ARN"
  value       = aws_db_instance.main.arn
}

output "resource_id" {
  description = "Database resource ID"
  value       = aws_db_instance.main.resource_id
}

output "hosted_zone_id" {
  description = "Database hosted zone ID"
  value       = aws_db_instance.main.hosted_zone_id
}

output "replica_endpoints" {
  description = "List of read replica endpoints"
  value       = [for r in aws_db_instance.read_replica : r.endpoint]
  sensitive   = true
}

output "replica_arns" {
  description = "List of read replica ARNs"
  value       = aws_db_instance.read_replica.*.arn
}

output "replica_count" {
  description = "Number of read replicas"
  value       = var.replica_count
}

output "subnet_group_id" {
  description = "Database subnet group ID"
  value       = aws_db_subnet_group.main.id
}

output "parameter_group_id" {
  description = "Database parameter group ID"
  value       = aws_db_parameter_group.main.id
}

output "security_group_id" {
  description = "Database security group ID"
  value       = var.security_group_id
}

output "iam_role_arn" {
  description = "RDS monitoring IAM role ARN"
  value       = aws_iam_role.rds_monitoring.arn
}

output "vault_connection_name" {
  description = "Vault database connection name"
  value       = var.enable_vault_integration ? vault_database_secret_backend_connection.postgres[0].name : ""
}

output "vault_app_role_name" {
  description = "Vault app role name"
  value       = var.enable_vault_integration ? vault_database_secret_backend_role.app[0].name : ""
}

output "vault_admin_role_name" {
  description = "Vault admin role name"
  value       = var.enable_vault_integration ? vault_database_secret_backend_role.admin[0].name : ""
}

output "connection_string" {
  description = "Database connection string"
  value       = "postgresql://${aws_db_instance.main.username}:${var.master_password}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "jdbc_connection_string" {
  description = "JDBC connection string"
  value       = "jdbc:postgresql://${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

output "is_multi_az" {
  description = "Whether Multi-AZ is enabled"
  value       = var.multi_az
}

output "storage_encrypted" {
  description = "Whether storage is encrypted"
  value       = aws_db_instance.main.storage_encrypted
}

output "backup_retention_period" {
  description = "Backup retention period"
  value       = aws_db_instance.main.backup_retention_period
}
