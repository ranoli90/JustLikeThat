# =============================================================================
# Staging Environment - Sprint 38
# =============================================================================

module "networking" {
  source = "../../modules/networking"

  environment          = "staging"
  app_name             = "apply-as-a-service"
  cidr_block           = "10.2.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]

  public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
  private_subnet_cidrs = ["10.2.101.0/24", "10.2.102.0/24", "10.2.103.0/24"]

  enable_nat_gateway   = true

  admin_cidr_blocks = ["10.0.0.0/8"]
}

module "compute" {
  source = "../../modules/compute"

  environment        = "staging"
  app_name          = "apply-as-a-service"
  vpc_id            = module.networking.vpc_id
  subnet_ids        = module.networking.subnet_public_ids
  security_group_id = module.networking.security_group_id

  instance_type     = "t3.medium"
  desired_count     = 2
  max_count         = 5
  min_count         = 1

  enable_blue_green_deployment = true
  enable_canary_deployment    = true

  health_check_path = "/health"
  app_port         = 3000

  enable_scheduled_scaling = false

  notification_email = var.notification_email
}

module "database" {
  source = "../../modules/database"

  environment        = "staging"
  app_name         = "apply-as-a-service"
  vpc_id           = module.networking.vpc_id
  subnet_ids       = module.networking.subnet_ids
  security_group_id = module.networking.security_group_db_id

  engine           = "postgres"
  engine_version   = "15.4"
  instance_class   = "db.t3.medium"
  allocated_storage = 50

  multi_az         = true
  backup_retention_period = 7

  replica_count    = 1
  replica_instance_class = "db.t3.medium"

  deletion_protection = true
  skip_final_snapshot = false

  enable_vault_integration = true
  vault_backend_path = "database"
}

module "cache" {
  source = "../../modules/cache"

  environment        = "staging"
  app_name         = "apply-as-a-service"
  subnet_ids       = module.networking.subnet_ids
  security_group_id = module.networking.security_group_cache_id

  cluster_mode_enabled = true
  engine_version      = "7.0"
  node_type           = "cache.t3.medium"
  num_node_groups     = 1
  replicas_per_node_group = 1

  enable_auth        = true
  automatic_failover_enabled = true

  snapshot_retention_limit = 3
}

module "queue" {
  source = "../../modules/queue"

  environment   = "staging"
  app_name    = "apply-as-a-service"
  queue_name  = "apply-as-a-service-staging"

  fifo_queue                    = true
  content_based_deduplication   = true
  visibility_timeout            = 300
  message_retention_seconds     = 604800

  enable_priority_queues = true

  create_dashboard = true
}

# =============================================================================
# Variables
# =============================================================================

variable "notification_email" {
  description = "Notification email for alerts"
  type        = string
  default     = "staging-alerts@apply-as-a-service.io"
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
