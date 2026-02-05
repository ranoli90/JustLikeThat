# =============================================================================
# Cache Module Outputs - Sprint 38
# =============================================================================

output "endpoint" {
  description = "Cache cluster endpoint"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.primary_endpoint_address : aws_elasticache_cluster.main[0].cache_nodes[0].address
  sensitive   = true
}

output "port" {
  description = "Cache cluster port"
  value       = var.port
}

output "arn" {
  description = "Cache cluster ARN"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.arn : aws_elasticache_cluster.main[0].arn
}

output "cluster_id" {
  description = "Cache cluster ID"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : aws_elasticache_cluster.main[0].id
}

output "replication_group_id" {
  description = "Replication group ID"
  value       = aws_elasticache_replication_group.main.id
}

output "configuration_endpoint" {
  description = "Configuration endpoint for Redis cluster"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.configuration_endpoint_address : ""
}

output "member_clusters" {
  description = "Member cluster endpoints"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.member_clusters : [aws_elasticache_cluster.main[0].cache_nodes[0].address]
}

output "num_node_groups" {
  description = "Number of node groups"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.num_node_groups : 1
}

output "replicas_per_node_group" {
  description = "Replicas per node group"
  value       = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.replicas_per_node_group : 1
}

output "at_rest_encryption_enabled" {
  description = "Whether at-rest encryption is enabled"
  value       = var.encryption_enabled
}

output "transit_encryption_enabled" {
  description = "Whether transit encryption is enabled"
  value       = var.transit_encryption_enabled
}

output "auth_enabled" {
  description = "Whether authentication is enabled"
  value       = var.enable_auth
}

output "automatic_failover_enabled" {
  description = "Whether automatic failover is enabled"
  value       = var.automatic_failover_enabled
}

output "subnet_group_id" {
  description = "Cache subnet group ID"
  value       = aws_elasticache_subnet_group.main.id
}

output "parameter_group_id" {
  description = "Cache parameter group ID"
  value       = aws_elasticache_parameter_group.main.id
}

output "security_group_id" {
  description = "Cache security group ID"
  value       = var.security_group_id
}

output "vault_secret_path" {
  description = "Vault secret path"
  value       = var.enable_vault_integration ? "${var.vault_mount_path}/data/${var.app_name}/cache/${var.environment}" : ""
}

output "connection_string" {
  description = "Redis connection string"
  value       = "redis://${var.enable_auth ? var.auth_token != "" ? "${var.auth_token}@" : ""}${var.cluster_mode_enabled ? aws_elasticache_replication_group.main.primary_endpoint_address : aws_elasticache_cluster.main[0].cache_nodes[0].address}:${var.port}"
  sensitive   = true
}

output "is_cluster_mode" {
  description = "Whether cluster mode is enabled"
  value       = var.cluster_mode_enabled
}
