# =============================================================================
# Cache Module - Sprint 38
# ElastiCache Redis with Cluster Mode and Vault Integration
# =============================================================================

# =============================================================================
# ElastiCache Subnet Group
# =============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.app_name}-cache-subnet-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.app_name}-cache-subnet-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# ElastiCache Parameter Group
# =============================================================================

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.app_name}-cache-params-${var.environment}"
  family = var.parameter_group_family

  # Performance tuning
  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  parameter {
    name  = "timeout"
    value = var.timeout
  }

  parameter {
    name  = "tcp-keepalive"
    value = var.tcp_keepalive
  }

  parameter {
    name  = "tcp-backlog"
    value = var.tcp_backlog
  }

  parameter {
    name  = "maxclients"
    value = var.maxclients
  }

  # Security
  parameter {
    name  = "rename-commands"
    value = "yes"
  }

  tags = {
    Name        = "${var.app_name}-cache-params-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# ElastiCache Replication Group (Redis Cluster)
# =============================================================================

resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "${var.app_name}-cache-${var.environment}"
  replication_group_description = "Redis cluster for ${var.app_name} ${var.environment}"

  engine            = "redis"
  engine_version   = var.engine_version
  node_type         = var.node_type
  num_node_groups   = var.num_node_groups
  replicas_per_node_group = var.replicas_per_node_group

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.security_group_id]

  # Authentication
  auth_token = var.enable_auth ? var.auth_token : null

  # High availability
  automatic_failover_enabled = var.automatic_failover_enabled

  # Snapshot
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window
  at_rest_encryption_enabled = var.encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled

  # Maintenance
  maintenance_window = var.maintenance_window

  # Tags
  tags = {
    Name        = "${var.app_name}-cache-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# ElastiCache Cluster (Non-clustered mode)
# =============================================================================

resource "aws_elasticache_cluster" "main" {
  count = var.cluster_mode_enabled ? 0 : 1

  cluster_id           = "${var.app_name}-cache-${var.environment}"
  engine              = "redis"
  engine_version      = var.engine_version
  node_type           = var.node_type
  num_cache_nodes     = var.num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [var.security_group_id]

  # Network
  port = var.port

  # Authentication
  auth_token = var.enable_auth ? var.auth_token : null

  # High availability
  automatic_failover_enabled = var.automatic_failover_enabled

  # Maintenance
  maintenance_window = var.maintenance_window

  # Encryption
  at_rest_encryption_enabled = var.encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled

  # Snapshot
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window          = var.snapshot_window

  tags = {
    Name        = "${var.app_name}-cache-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# ElastiCache Global Replication Group (Cross-region)
# =============================================================================

resource "aws_elasticache_global_replication_group" "main" {
  count = var.enable_global_replication ? 1 : 0

  global_replication_group_id_suffix = "${var.app_name}-global-${var.environment}"
  primary_replication_group_id       = aws_elasticache_replication_group.main.id

  at_rest_encryption_enabled  = var.encryption_enabled
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token                  = var.enable_auth ? var.auth_token : null

  tags = {
    Name        = "${var.app_name}-cache-global-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# ElastiCache User (for Redis ACL)
# =============================================================================

resource "aws_elasticache_user" "app" {
  count = var.enable_user_based_access ? 1 : 0

  user_id       = "${var.app_name}-app-${var.environment}"
  user_name    = "${var.app_name}_app"
  engine       = "redis"
  passwords    = [var.app_user_password]
  access_string = var.app_user_access_string

  tags = {
    Name        = "${var.app_name}-cache-user-app-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_elasticache_user" "readonly" {
  count = var.enable_user_based_access ? 1 : 0

  user_id       = "${var.app_name}-readonly-${var.environment}"
  user_name    = "${var.app_name}_readonly"
  engine       = "redis"
  passwords    = [var.readonly_user_password]
  access_string = var.readonly_user_access_string

  tags = {
    Name        = "${var.app_name}-cache-user-ro-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# Vault Integration for Dynamic Secrets
# =============================================================================

# KV secrets engine for static credentials
resource "vault_kv_secret_v2" "cache" {
  count = var.enable_vault_integration ? 1 : 0

  mount = var.vault_mount_path
  name  = "${var.app_name}/cache/${var.environment}"

  data = {
    host     = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.primary_endpoint_address : aws_elasticache_cluster.main[0].cache_nodes[0].address
    port     = var.port
    username = var.enable_user_based_access ? aws_elasticache_user.app[0].user_name : "default"
    password = var.enable_user_based_access ? var.app_user_password : var.auth_token
  }
}

# =============================================================================
# CloudWatch Alarms
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "cache_cpu" {
  alarm_name          = "${var.app_name}-cache-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    CacheClusterId    = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : aws_elasticache_cluster.main[0].id
    CacheNodeId       = "0001"
    ReplicationGroupId = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : ""
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.app_name}-cache-cpu-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "cache_memory" {
  alarm_name          = "${var.app_name}-cache-memory-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = 75

  dimensions = {
    CacheClusterId    = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : aws_elasticache_cluster.main[0].id
    CacheNodeId       = "0001"
    ReplicationGroupId = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : ""
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.app_name}-cache-memory-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "cache_evictions" {
  alarm_name          = "${var.app_name}-cache-evictions-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CacheEvictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 100

  dimensions = {
    CacheClusterId    = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : aws_elasticache_cluster.main[0].id
    ReplicationGroupId = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : ""
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.app_name}-cache-evictions-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "cache_connections" {
  alarm_name          = "${var.app_name}-cache-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CurrConnections"
  namespace           = "AWS/ElastiCache"
  period              = 60
  statistic           = "Average"
  threshold           = var.max_connections * 0.8

  dimensions = {
    CacheClusterId    = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : aws_elasticache_cluster.main[0].id
    ReplicationGroupId = var.cluster_mode_enabled ? aws_elasticache_replication_group.main.id : ""
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.app_name}-cache-connections-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}
