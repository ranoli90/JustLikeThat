# =============================================================================
# Vault Module - Sprint 38
# HashiCorp Vault Integration for Secret Management
# =============================================================================

# =============================================================================
# Vault KV Secrets Engine
# =============================================================================

resource "vault_mount" "kv" {
  count = var.enable_kv_engine ? 1 : 0

  path        = var.kv_mount_path
  type        = "kv"
  description = "KV secrets engine for ${var.app_name}"
  options = {
    version = var.kv_version
  }

  default_lease_ttl_seconds = var.default_lease_ttl
  max_lease_ttl_seconds     = var.max_lease_ttl
}

# =============================================================================
# KV Secret Paths
# =============================================================================

resource "vault_kv_secret_v2" "database" {
  count = var.enable_kv_engine ? 1 : 0

  mount = var.kv_mount_path
  name  = "${var.app_name}/database/${var.environment}"

  data = {
    host     = var.database_host
    port     = var.database_port
    username = var.database_username
    password = var.database_password
    name     = var.database_name
    ssl_mode = "require"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "vault_kv_secret_v2" "cache" {
  count = var.enable_kv_engine ? 1 : 0

  mount = var.kv_mount_path
  name  = "${var.app_name}/cache/${var.environment}"

  data = {
    host     = var.cache_host
    port     = var.cache_port
    password = var.cache_password
  }
}

resource "vault_kv_secret_v2" "application" {
  count = var.enable_kv_engine ? 1 : 0

  mount = var.kv_mount_path
  name  = "${var.app_name}/application/${var.environment}"

  data = var.application_secrets
}

resource "vault_kv_secret_v2" "jwt" {
  count = var.enable_kv_engine ? 1 : 0

  mount = var.kv_mount_path
  name  = "${var.app_name}/jwt/${var.environment}"

  data = {
    secret_key = var.jwt_secret_key
    algorithm  = "HS256"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "vault_kv_secret_v2" "encryption" {
  count = var.enable_kv_engine ? 1 : 0

  mount = var.kv_mount_path
  name  = "${var.app_name}/encryption/${var.environment}"

  data = {
    master_key = var.encryption_master_key
  }

  lifecycle {
    prevent_destroy = true
  }
}

# =============================================================================
# Vault Database Secrets Engine
# =============================================================================

resource "vault_mount" "database" {
  count = var.enable_database_engine ? 1 : 0

  path        = var.database_engine_path
  type        = "database"
  description = "Database secrets engine for ${var.app_name}"
}

# =============================================================================
# Vault Policy
# =============================================================================

# Read-only policy for applications
resource "vault_policy" "app" {
  name = "${var.app_name}-app-${var.environment}"

  policy = <<EOF
path "${var.kv_mount_path}/data/${var.app_name}/database/${var.environment}" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/data/${var.app_name}/cache/${var.environment}" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/data/${var.app_name}/application/${var.environment}" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/data/${var.app_name}/jwt/${var.environment}" {
  capabilities = ["read"]
}

path "${var.kv_mount_path}/data/${var.app_name}/encryption/${var.environment}" {
  capabilities = ["read"]
}

path "${var.database_engine_path}/creds/${var.app_name}-app-role" {
  capabilities = ["read"]
}
EOF
}

# Admin policy for deployments
resource "vault_policy" "admin" {
  name = "${var.app_name}-admin-${var.environment}"

  policy = <<EOF
path "${var.kv_mount_path}/data/${var.app_name}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "${var.kv_mount_path}/metadata/${var.app_name}/*" {
  capabilities = ["list"]
}

path "${var.database_engine_path}/creds/${var.app_name}-admin-role" {
  capabilities = ["read"]
}

path "sys/leases/lookup" {
  capabilities = ["update"]
}

path "sys/leases/revoke" {
  capabilities = ["update"]
}
EOF
}

# Read-only audit policy
resource "vault_policy" "audit" {
  name = "${var.app_name}-audit-${var.environment}"

  policy = <<EOF
path "sys/health" {
  capabilities = ["read"]
}

path "sys/audit" {
  capabilities = ["read", "list"]
}

path "sys/loggers" {
  capabilities = ["read", "list"]
}
EOF
}

# =============================================================================
# Vault Auth Methods
# =============================================================================

# Kubernetes auth (for K8s deployments)
resource "vault_auth_backend" "kubernetes" {
  count = var.enable_kubernetes_auth ? 1 : 0

  type = "kubernetes"
}

resource "vault_kubernetes_auth_backend_config" "main" {
  count = var.enable_kubernetes_auth ? 1 : 0

  backend                = vault_auth_backend.kubernetes[0].path
  kubernetes_host        = var.kubernetes_host
  kubernetes_ca_cert     = var.kubernetes_ca_cert
  token_reviewer_jwt     = var.token_reviewer_jwt
  issuer                 = var.kubernetes_issuer
}

resource "vault_kubernetes_auth_backend_role" "app" {
  count = var.enable_kubernetes_auth ? 1 : 0

  backend                          = vault_auth_backend.kubernetes[0].path
  role_name                        = "${var.app_name}-app-${var.environment}"
  bound_service_account_names      = var.app_service_accounts
  bound_namespace                  = var.kubernetes_namespace
  policies                         = [vault_policy.app.name]
  ttl                              = var.token_ttl
  max_ttl                          = var.token_max_ttl
}

resource "vault_kubernetes_auth_backend_role" "admin" {
  count = var.enable_kubernetes_auth ? 1 : 0

  backend                          = vault_auth_backend.kubernetes[0].path
  role_name                        = "${var.app_name}-admin-${var.environment}"
  bound_service_account_names      = var.admin_service_accounts
  bound_namespace                  = var.kubernetes_namespace
  policies                         = [vault_policy.admin.name]
  ttl                              = var.token_ttl
  max_ttl                          = var.token_max_ttl
}

# AWS auth (for EC2/Lambda deployments)
resource "vault_auth_backend" "aws" {
  count = var.enable_aws_auth ? 1 : 0

  type = "aws"
}

resource "vault_aws_auth_backend_client" "main" {
  count = var.enable_aws_auth ? 1 : 0

  backend = vault_auth_backend.aws[0].path
  type    = "ec2"
}

resource "vault_aws_auth_backend_role" "ec2" {
  count = var.enable_aws_auth ? 1 : 0

  backend        = vault_auth_backend.aws[0].path
  role           = "${var.app_name}-ec2-${var.environment}"
  auth_type      = "ec2"
  policies       = [vault_policy.app.name]
  bound_account_ids = var.aws_account_ids
  ttl            = var.token_ttl
  max_ttl        = var.token_max_ttl
}

# =============================================================================
# Secret Rotation Configuration
# =============================================================================

resource "vault_kv_secret" "rotation_policy" {
  count = var.enable_rotation_policy ? 1 : 0

  path = "${var.kv_mount_path}/rotation/${var.app_name}/${var.environment}"

  data = {
    rotation_enabled    = "true"
    rotation_period     = var.rotation_period
    rotation_schedule  = var.rotation_schedule
    last_rotated       = timestamp()
    next_rotation      = timeadd(timestamp(), var.rotation_period)
  }
}

# =============================================================================
# Audit Logging
# =============================================================================

resource "vault_audit" "file" {
  type = "file"
  options = {
    file_path = var.audit_log_path
  }
}

resource "vault_audit" "socket" {
  count = var.enable_audit_socket ? 1 : 0

  type = "socket"
  options = {
    address = var.audit_socket_address
    socket_type = "tcp"
    format = "json"
  }
}

# =============================================================================
# Encryption as a Service
# =============================================================================

resource "vault_mount" "transit" {
  count = var.enable_transit_engine ? 1 : 0

  path        = "transit"
  type        = "transit"
  description = "Transit secrets engine for encryption"
}

resource "vault_transit_secret_backend_key" "encryption_key" {
  count = var.enable_transit_engine ? 1 : 0

  backend = vault_mount.transit[0].path
  name    = "${var.app_name}-encryption-key-${var.environment}"

  type         = "aes256-gcm"
  deletion_allowed = var.allow_key_deletion
  exportable    = var.exportable_keys

  auto_rotate_period = var.key_rotation_period
}

resource "vault_transit_secret_backend_key" "signing_key" {
  count = var.enable_transit_engine ? 1 : 0

  backend = vault_mount.transit[0].path
  name    = "${var.app_name}-signing-key-${var.environment}"

  type         = "rsa-2048"
  deletion_allowed = var.allow_key_deletion
  exportable    = false
}
