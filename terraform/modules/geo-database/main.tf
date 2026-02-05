# Geo-Distributed Database Terraform Module
# Configures CockroachDB, Spanner, DynamoDB Global Tables, and multi-region PostgreSQL

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "database_type" {
  description = "Type of database (cockroachdb, spanner, dynamodb, citus)"
  type        = string
}

variable "regions" {
  description = "Regions to deploy database across"
  type        = list(string)
}

variable "primary_region" {
  description = "Primary region for writes"
  type        = string
}

variable "instance_size" {
  description = "Size of database instance"
  type        = string
  default     = "medium"
}

variable "replication_factor" {
  description = "Number of replicas per region"
  type        = number
  default     = 3
}

# CockroachDB Dedicated Cluster
resource "cockroachdb_cluster" "main" {
  count = var.database_type == "cockroachdb" ? 1 : 0
  
  name           = "${var.environment}-cockroachdb"
  plan           = "dedicated"
  cloud_provider = "aws"
  
  regions = [for region in var.regions : {
    name       = region
    node_count = 3
  }]
  
  sql_bits = {
    max_connections = 5000
    max_memory      = "8Gi"
  }
  
  security {
    transport_layer_tls_enabled = true
    ciphers                     = ["ECDHE-RSA-AES128-GCM-SHA256"]
  }
}

# Google Cloud Spanner
resource "google_spanner_instance" "main" {
  count = var.database_type == "spanner" ? 1 : 0
  
  name        = "${var.environment}-spanner"
  config      = "nam-eur-asia1"  # Multi-region config
  description = "Global Spanner instance for ${var.environment}"
  
  num_nodes = 2
  
  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# DynamoDB Global Tables
resource "aws_dynamodb_table" "global" {
  count = var.database_type == "dynamodb" ? 1 : 0
  
  name         = "${var.environment}-global-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"
  
  attribute {
    name = "PK"
    type = "S"
  }
  
  attribute {
    name = "SK"
    type = "S"
  }
  
  # Enable global tables
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  # Global table replication
  replica {
    region_name = var.primary_region
  }
  
  dynamic "replica" {
    for_each = [for region in var.regions : region if region != var.primary_region]
    content {
      region_name = replica.value
    }
  }
  
  tags = {
    Name        = "${var.environment}-dynamodb-global"
    Environment = var.environment
  }
}

# Citus Distributed PostgreSQL on Azure
resource "azurerm_postgresql_flexible_server" "main" {
  count = var.database_type == "citus" ? 1 : 0
  
  name                   = "${var.environment}-citus"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  administrator_login    = var.admin_username
  administrator_password = var.admin_password
  
  sku_name = var.instance_size == "small" ? "GP_Standard_D2s_v3" : "GP_Standard_D4s_v3"
  
  storage_mb = var.instance_size == "small" ? 32768 : 65536
  
  high_availability {
    mode = "ZoneRedundant"
  }
  
  backup_retention_days = 30
  
  geo_redundant_backup_enabled = true
}

# PostgreSQL with Citus Extension (Self-hosted)
resource "postgresql_flexible_server" "main" {
  count = var.database_type == "citus" ? length(var.regions) : 0
  
  name                   = "${var.environment}-citus-${var.regions[count.index]}"
  resource_group_name     = azurerm_resource_group.main.name
  location               = var.regions[count.index]
  version                = "15"
  administrator_login    = var.admin_username
  administrator_password = var.admin_password
  
  zone = split("-", var.regions[count.index])[1]
  
  high_availability {
    mode                = "ZoneRedundant"
    standby_availability_zone = "2"
  }
  
  citus_extension {
    version = "12"
  }
}

# Read Replicas
resource "aws_db_instance" "replica" {
  count = var.database_type == "postgresql" ? length(var.replica_regions) : 0
  
  identifier = "${var.environment}-replica-${var.replica_regions[count.index]}"
  
  # Must be a real replica
  replicate_source_db = aws_db_instance.primary.identifier
  
  instance_class      = var.instance_size
  availability_zone   = "${var.replica_regions[count.index]}a"
  multi_az            = true
  
  # Disable backup on replicas
  backup_retention_period = 0
  
  tags = {
    Name        = "${var.environment}-replica-${var.replica_regions[count.index]}"
    Environment = var.environment
    Replica     = "true"
  }
}

# Connection Pooling
resource "aws_rds_proxy" "main" {
  count = var.database_type == "postgresql" ? 1 : 0
  
  name                   = "${var.environment}-proxy"
  target_role            = "READ_WRITE"
  db_proxy_endpoint_type  = "REGIONAL"
  
  auth_scheme = "SECRETS"
  secrets     = [aws_secretsmanager_secret_version.db_creds.arn]
  
  vpc_security_group_ids = [aws_security_group.proxy.id]
  vpc_subnet_ids         = var.subnet_ids
  
  tags = {
    Name        = "${var.environment}-proxy"
    Environment = var.environment
  }
}

# Security Group for Database
resource "aws_security_group" "database" {
  name        = "${var.environment}-db-sg"
  description = "Security group for database access"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }
}

# Secrets Manager for Database Credentials
resource "aws_secretsmanager_secret" "db_creds" {
  name = "${var.environment}/database/credentials"
}

resource "aws_secretsmanager_secret_version" "db_creds" {
  secret_id     = aws_secretsmanager_secret.db_creds.id
  secret_string = jsonencode({
    username = var.admin_username
    password = var.admin_password
    host     = aws_db_instance.primary.address
    port     = 5432
    database = var.database_name
  })
}

# Monitoring
resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  count = var.database_type == "postgresql" ? 1 : 0
  
  alarm_name          = "${var.environment}-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "db_replica_lag" {
  count = length(var.replica_regions)
  
  alarm_name          = "${var.environment}-db-replica-lag-${var.replica_regions[count.index]}"
  comparison_operator  = "GreaterThanThreshold"
  evaluation_periods   = 2
  metric_name          = "ReplicaLag"
  namespace            = "AWS/RDS"
  period               = 60
  statistic            = "Average"
  threshold            = 100
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.replica[count.index].identifier
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Outputs
output "database_endpoints" {
  description = "Database connection endpoints"
  value = {
    primary = var.database_type == "postgresql" ? aws_db_instance.primary.endpoint : null
    replicas = var.database_type == "postgresql" ? {
      for i, region in var.replica_regions :
      region => aws_db_instance.replica[i].endpoint
    } : null
    cockroachdb = var.database_type == "cockroachdb" ? cockroachdb_cluster.main[0].connection_string : null
    spanner = var.database_type == "spanner" ? google_spanner_instance.main[0].display_name : null
    dynamodb = var.database_type == "dynamodb" ? aws_dynamodb_table.global[0].arn : null
  }
}

output "connection_pool_size" {
  description = "Maximum connection pool size"
  value       = var.database_type == "postgresql" ? aws_rds_proxy.main[0].max_connections : 1000
}
