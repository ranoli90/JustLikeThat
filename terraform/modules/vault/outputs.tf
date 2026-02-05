# =============================================================================
# Vault Module Outputs - Sprint 38
# =============================================================================

output "secrets_path" {
  description = "Base secrets path"
  value       = "${var.kv_mount_path}/data/${var.app_name}"
}

output "database_secrets_path" {
  description = "Database secrets path"
  value       = "${var.kv_mount_path}/data/${var.app_name}/database/${var.environment}"
}

output "cache_secrets_path" {
  description = "Cache secrets path"
  value       = "${var.kv_mount_path}/data/${var.app_name}/cache/${var.environment}"
}

output "application_secrets_path" {
  description = "Application secrets path"
  value       = "${var.kv_mount_path}/data/${var.app_name}/application/${var.environment}"
}

output "jwt_secrets_path" {
  description = "JWT secrets path"
  value       = "${var.kv_mount_path}/data/${var.app_name}/jwt/${var.environment}"
}

output "encryption_secrets_path" {
  description = "Encryption secrets path"
  value       = "${var.kv_mount_path}/data/${var.app_name}/encryption/${var.environment}"
}

output "dynamic_db_creds_path" {
  description = "Dynamic database credentials path"
  value       = "${var.database_engine_path}/creds/${var.app_name}-app-role"
}

output "app_policy_name" {
  description = "Application policy name"
  value       = vault_policy.app.name
}

output "admin_policy_name" {
  description = "Admin policy name"
  value       = vault_policy.admin.name
}

output "audit_policy_name" {
  description = "Audit policy name"
  value       = vault_policy.audit.name
}

output "kubernetes_auth_path" {
  description = "Kubernetes auth path"
  value       = var.enable_kubernetes_auth ? vault_auth_backend.kubernetes[0].path : ""
}

output "kubernetes_role_name" {
  description = "Kubernetes role name"
  value       = var.enable_kubernetes_auth ? vault_kubernetes_auth_backend_role.app[0].role_name : ""
}

output "aws_auth_path" {
  description = "AWS auth path"
  value       = var.enable_aws_auth ? vault_auth_backend.aws[0].path : ""
}

output "transit_key_path" {
  description = "Transit encryption key path"
  value       = var.enable_transit_engine ? "transit/keys/${var.app_name}-encryption-key-${var.environment}" : ""
}

output "rotation_policy_path" {
  description = "Rotation policy path"
  value       = var.enable_rotation_policy ? "${var.kv_mount_path}/rotation/${var.app_name}/${var.environment}" : ""
}

output "is_v2_kv_engine" {
  description = "Whether KV v2 engine is enabled"
  value       = var.kv_version == 2
}
