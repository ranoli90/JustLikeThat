# =============================================================================
# Dev Environment - Sprint 38
# =============================================================================

module "networking" {
  source = "../../modules/networking"

  environment          = "dev"
  app_name             = "apply-as-a-service"
  cidr_block           = "10.1.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b"]

  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs = ["10.1.101.0/24", "10.1.102.0/24"]

  enable_nat_gateway   = true

  admin_cidr_blocks = ["0.0.0.0/0"]
}

module "compute" {
  source = "../../modules/compute"

  environment        = "dev"
  app_name          = "apply-as-a-service"
  vpc_id            = module.networking.vpc_id
  subnet_ids        = module.networking.subnet_public_ids
  security_group_id = module.networking.security_group_id

  instance_type     = "t3.medium"
  desired_count     = 1
  max_count         = 3
  min_count         = 1

  enable_blue_green_deployment = false
  enable_canary_deployment    = false

  health_check_path = "/health"
  app_port         = 3000

  enable_scheduled_scaling = false
}

module "database" {
  source = "../../modules/database"

  environment        = "dev"
  app_name         = "apply-as-a-service"
  vpc_id           = module.networking.vpc_id
  subnet_ids       = module.networking.subnet_ids
  security_group_id = module.networking.security_group_db_id

  engine           = "postgres"
  engine_version   = "15.4"
  instance_class   = "db.t3.micro"
  allocated_storage = 20

  multi_az         = false
  backup_retention_period = 1

  replica_count    = 0

  deletion_protection = false
  skip_final_snapshot = true

  enable_vault_integration = false
}

module "cache" {
  source = "../../modules/cache"

  environment        = "dev"
  app_name         = "apply-as-a-service"
  subnet_ids       = module.networking.subnet_ids
  security_group_id = module.networking.security_group_cache_id

  cluster_mode_enabled = false
  engine_version      = "7.0"
  node_type           = "cache.t3.micro"
  num_cache_nodes    = 1
  replicas_per_node_group = 0

  enable_auth        = false
  automatic_failover_enabled = false

  snapshot_retention_limit = 0
}

module "queue" {
  source = "../../modules/queue"

  environment   = "dev"
  app_name    = "apply-as-a-service"
  queue_name  = "apply-as-a-service-dev"

  fifo_queue                    = false
  content_based_deduplication   = false
  visibility_timeout            = 60
  message_retention_seconds     = 3600

  enable_priority_queues = false

  create_dashboard = false
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
