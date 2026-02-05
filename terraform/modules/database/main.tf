# =============================================================================
# Database Module - Sprint 38
# RDS PostgreSQL with Multi-AZ, Read Replicas, and Vault Integration
# =============================================================================

# =============================================================================
# RDS Subnet Group
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.app_name}-db-subnet-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# RDS Parameter Group
# =============================================================================

resource "aws_db_parameter_group" "main" {
  name   = "${var.app_name}-db-params-${var.environment}"
  family = var.parameter_group_family

  # Performance optimization parameters
  parameter {
    name  = "shared_buffers"
    value = var.shared_buffers
  }

  parameter {
    name  = "work_mem"
    value = var.work_mem
  }

  parameter {
    name  = "maintenance_work_mem"
    value = var.maintenance_work_mem
  }

  parameter {
    name  = "effective_cache_size"
    value = var.effective_cache_size
  }

  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.log_min_duration_statement
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  # Security parameters
  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  tags = {
    Name        = "${var.app_name}-db-params-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# KMS Key for RDS Encryption
# =============================================================================

resource "aws_kms_key" "rds_key" {
  description             = "KMS key for RDS encryption and Performance Insights"
  enable_key_rotation     = true
  deletion_window_in_days  = 30

  key_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM policies for key management"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.account_id}:root"
        }
        Action = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-rds-key-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# RDS Instance - Primary
# =============================================================================

resource "aws_db_instance" "main" {
  identifier = "${var.app_name}-db-${var.environment}"

  engine            = var.engine
  engine_version     = var.engine_version
  instance_class     = var.instance_class
  allocated_storage  = var.allocated_storage
  storage_encrypted  = true
  storage_type       = var.storage_type
  kms_key_id        = aws_kms_key.rds_key.arn

  # Network
  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Credentials (managed by Vault in production)
  username             = var.master_username
  password             = var.master_password
  manage_master_user_password = var.manage_master_password

  # Backup and maintenance
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window

  # High availability
  multi_az                = var.multi_az
  availability_zone       = var.multi_az ? null : var.availability_zone
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  deletion_protection     = var.deletion_protection
  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.app_name}-db-final-${var.environment}"

  # Performance
  performance_insights_enabled          = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_retention
  performance_insights_kms_key_id       = aws_kms_key.rds_key.arn
  monitoring_interval                   = var.monitoring_interval
  monitoring_role_arn                   = var.enable_enhanced_monitoring ? aws_iam_role.rds_monitoring.arn : null

  # Parameters
  parameter_group_name = aws_db_parameter_group.main.name

  # Tags
  tags = {
    Name        = "${var.app_name}-db-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    Primary     = "true"
  }

  # Timeouts
  timeouts {
    create = var.db_create_timeout
    update = var.db_update_timeout
    delete = var.db_delete_timeout
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [password]
  }
}

# =============================================================================
# RDS Read Replicas
# =============================================================================

resource "aws_db_instance" "read_replica" {
  count = var.replica_count

  identifier = "${var.app_name}-db-${var.environment}-replica-${count.index + 1}"

  engine            = var.engine
  engine_version   = var.engine_version
  instance_class   = var.replica_instance_class
  storage_encrypted = true
  storage_type     = var.storage_type

  # Source database
  replicate_source_db = aws_db_instance.main.identifier

  # Network
  vpc_security_group_ids = [var.security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  # Backup
  backup_retention_period = 0
  skip_final_snapshot    = true

  # Performance
  performance_insights_enabled = var.performance_insights_enabled
  monitoring_interval          = var.monitoring_interval
  monitoring_role_arn          = var.enable_enhanced_monitoring ? aws_iam_role.rds_monitoring.arn : null

  tags = {
    Name        = "${var.app_name}-db-${var.environment}-replica-${count.index + 1}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    Replica     = "true"
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [password]
  }
}

# =============================================================================
# IAM Role for Enhanced Monitoring
# =============================================================================

resource "aws_iam_role" "rds_monitoring" {
  name = "${var.app_name}-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-rds-monitoring-role-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =============================================================================
# Vault Dynamic Secrets (Optional)
# =============================================================================

# Vault secrets engine path for database credentials
resource "vault_database_secret_backend_connection" "postgres" {
  count = var.enable_vault_integration ? 1 : 0

  backend       = var.vault_backend_path
  name          = "${var.app_name}-postgres-${var.environment}"
  plugin_name   = "postgresql-database-plugin"

  connection_url = "postgres://{{username}}:{{password}}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"

  # Static role (for existing users)
  allowed_roles = ["${var.app_name}-app-role", "${var.app_name}-admin-role"]

  # PostgreSQL specific configuration
  postgresql {
    host     = split(":", aws_db_instance.main.endpoint)[0]
    port     = tonumber(split(":", aws_db_instance.main.endpoint)[1])
    username = aws_db_instance.main.username
    password = var.master_password
    database = aws_db_instance.main.db_name
  }
}

# Dynamic secrets role for applications
resource "vault_database_secret_backend_role" "app" {
  count = var.enable_vault_integration ? 1 : 0

  backend       = var.vault_backend_path
  name          = "${var.app_name}-app-role"
  database      = vault_database_secret_backend_connection.postgres[0].name
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT CONNECT ON DATABASE ${aws_db_instance.main.db_name} TO \"{{name}}\";",
    "GRANT USAGE ON SCHEMA public TO \"{{name}}\";",
    "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";"
  ]
  revocation_statements = [
    "DROP ROLE IF EXISTS \"{{name}}\";"
  ]
  default_ttl = var.vault_default_ttl
  max_ttl     = var.vault_max_ttl
}

# Admin role for operations
resource "vault_database_secret_backend_role" "admin" {
  count = var.enable_vault_integration ? 1 : 0

  backend       = var.vault_backend_path
  name          = "${var.app_name}-admin-role"
  database      = vault_database_secret_backend_connection.postgres[0].name
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT CONNECT ON DATABASE ${aws_db_instance.main.db_name} TO \"{{name}}\";",
    "GRANT ALL PRIVILEGES ON DATABASE ${aws_db_instance.main.db_name} TO \"{{name}}\";",
    "GRANT ALL ON SCHEMA public TO \"{{name}}\";",
    "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
    "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO \"{{name}}\";"
  ]
  revocation_statements = [
    "DROP ROLE IF EXISTS \"{{name}}\";"
  ]
  default_ttl = var.vault_default_ttl
  max_ttl     = var.vault_max_ttl
}

# =============================================================================
# Database Migration Support
# =============================================================================

# Option group for migrations
resource "aws_db_option_group" "main" {
  name                 = "${var.app_name}-db-options-${var.environment}"
  engine_name          = var.engine
  major_engine_version = split(".", var.engine_version)[0]

  option {
    option_name = "TDE"
  }

  tags = {
    Name        = "${var.app_name}-db-options-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# CloudWatch Alarms
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${var.app_name}-db-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = 80

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.app_name}-db-cpu-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "${var.app_name}-db-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Average"
  threshold           = var.max_connections * 0.8

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.app_name}-db-connections-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "db_replica_lag" {
  count = var.replica_count > 0 ? 1 : 0

  alarm_name          = "${var.app_name}-db-replica-lag-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = 60
  statistic           = "Maximum"
  threshold           = 30

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.app_name}-db-replica-lag-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}
