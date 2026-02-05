# =============================================================================
# Production Environment - Sprint 38
# Full production setup with all HA features
# =============================================================================

module "networking" {
  source = "../../modules/networking"

  environment          = "prod"
  app_name             = "apply-as-a-service"
  cidr_block           = "10.0.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d"]

  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24", "10.0.4.0/24"]
  private_subnet_cidrs = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24", "10.0.104.0/24"]

  enable_nat_gateway   = true

  admin_cidr_blocks = ["10.0.0.0/8"]
}

module "compute" {
  source = "../../modules/compute"

  environment        = "prod"
  app_name          = "apply-as-a-service"
  vpc_id            = module.networking.vpc_id
  subnet_ids        = module.networking.subnet_public_ids
  security_group_id = module.networking.security_group_id

  instance_type      = "t3.xlarge"
  desired_count      = 3
  max_count          = 10
  min_count          = 2
  on_demand_percentage = 70

  enable_blue_green_deployment = true
  enable_canary_deployment    = true

  health_check_path = "/health"
  app_port         = 3000

  health_check_grace_period = 300
  deregistration_delay     = 30

  enable_scheduled_scaling = true
  scale_up_schedule       = "0 7 * * 1-5"
  scale_down_schedule     = "0 19 * * 1-5"

  notification_email = var.notification_email
}

module "database" {
  source = "../../modules/database"

  environment        = "prod"
  app_name         = "apply-as-a-service"
  vpc_id           = module.networking.vpc_id
  subnet_ids       = module.networking.subnet_ids
  security_group_id = module.networking.security_group_db_id

  engine           = "postgres"
  engine_version   = "15.4"
  instance_class   = "db.r5.large"
  allocated_storage = 200
  storage_type     = "gp3"

  multi_az         = true
  backup_retention_period = 30

  replica_count    = 2
  replica_instance_class = "db.r5.large"

  performance_insights_enabled = true
  performance_insights_retention = 731
  enable_enhanced_monitoring = true

  deletion_protection = true
  skip_final_snapshot = false

  enable_vault_integration = true
  vault_backend_path = "database"
}

module "cache" {
  source = "../../modules/cache"

  environment        = "prod"
  app_name         = "apply-as-a-service"
  subnet_ids       = module.networking.subnet_ids
  security_group_id = module.networking.security_group_cache_id

  cluster_mode_enabled = true
  engine_version      = "7.0"
  node_type           = "cache.r5.large"
  num_node_groups     = 2
  replicas_per_node_group = 1

  enable_auth        = true
  automatic_failover_enabled = true
  enable_user_based_access = true

  snapshot_retention_limit = 7
  snapshot_window         = "05:00-06:00"

  enable_global_replication = var.enable_global_replication
}

module "queue" {
  source = "../../modules/queue"

  environment   = "prod"
  app_name    = "apply-as-a-service"
  queue_name  = "apply-as-a-service-prod"

  fifo_queue                    = true
  content_based_deduplication   = true
  visibility_timeout            = 300
  message_retention_seconds     = 1209600

  enable_priority_queues = true

  alarm_threshold    = 5000
  max_age_threshold = 3600

  create_dashboard = true
}

module "vault_integration" {
  source = "../../modules/vault"

  environment        = "prod"
  app_name         = "apply-as-a-service"

  enable_kv_engine      = true
  enable_database_engine = true
  enable_transit_engine = true

  enable_kubernetes_auth = true
  enable_aws_auth       = true

  enable_rotation_policy = true
  rotation_period       = "24h"
  rotation_schedule    = "0 0 * * *"

  enable_audit_socket = true
  audit_socket_address = "127.0.0.1:1234"

  database_host     = module.database.endpoint
  database_port     = module.database.port
  database_name     = module.database.name
  cache_host       = module.cache.endpoint
  cache_port      = module.cache.port
}

# =============================================================================
# Variables
# =============================================================================

variable "notification_email" {
  description = "Notification email for alerts"
  type        = string
  default     = "prod-alerts@apply-as-a-service.io"
}

variable "enable_global_replication" {
  description = "Enable global cache replication"
  type        = bool
  default     = false
}

# =============================================================================
# Outputs
# =============================================================================

output "vpc_id" {
  value = module.networking.vpc_id
}

output "database_endpoint" {
  value     = module.database.endpoint
  sensitive = true
}

output "cache_endpoint" {
  value     = module.cache.endpoint
  sensitive = true
}

output "alb_dns_name" {
  value = module.compute.alb_dns_name
}

output "queue_url" {
  value = module.queue.queue_url
}

output "replica_endpoints" {
  value     = module.database.replica_endpoints
  sensitive = true
}

output "vault_secrets_path" {
  value = module.vault_integration.secrets_path
}
