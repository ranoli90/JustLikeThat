# =============================================================================
# DR (Disaster Recovery) Environment - Sprint 38
# Cross-region disaster recovery setup
# =============================================================================

module "networking" {
  source = "../../modules/networking"

  environment          = "dr"
  app_name             = "apply-as-a-service"
  cidr_block           = "10.20.0.0/16"
  availability_zones   = ["us-west-2a", "us-west-2b", "us-west-2c"]

  public_subnet_cidrs  = ["10.20.1.0/24", "10.20.2.0/24", "10.20.3.0/24"]
  private_subnet_cidrs = ["10.20.101.0/24", "10.20.102.0/24", "10.20.103.0/24"]

  enable_nat_gateway   = true

  admin_cidr_blocks = ["10.0.0.0/8"]
}

module "compute" {
  source = "../../modules/compute"

  environment        = "dr"
  app_name          = "apply-as-a-service"
  vpc_id            = module.networking.vpc_id
  subnet_ids        = module.networking.subnet_public_ids
  security_group_id = module.networking.security_group_id

  instance_type      = "t3.xlarge"
  desired_count      = 2
  max_count          = 6
  min_count          = 1

  enable_blue_green_deployment = true
  enable_canary_deployment    = false

  health_check_path = "/health"
  app_port         = 3000

  enable_scheduled_scaling = false
}

module "database" {
  source = "../../modules/database"

  environment        = "dr"
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

  replica_count    = 1
  replica_instance_class = "db.r5.large"

  performance_insights_enabled = true
  enable_enhanced_monitoring = true

  deletion_protection = true
  skip_final_snapshot = false

  enable_vault_integration = true
}

module "cache" {
  source = "../../modules/cache"

  environment        = "dr"
  app_name         = "apply-as-a-service"
  subnet_ids       = module.networking.subnet_ids
  security_group_id = module.networking.security_group_cache_id

  cluster_mode_enabled = true
  engine_version      = "7.0"
  node_type           = "cache.r5.large"
  num_node_groups     = 1
  replicas_per_node_group = 1

  enable_auth        = true
  automatic_failover_enabled = true

  snapshot_retention_limit = 7
}

module "queue" {
  source = "../../modules/queue"

  environment   = "dr"
  app_name    = "apply-as-a-service"
  queue_name  = "apply-as-a-service-dr"

  fifo_queue                    = true
  content_based_deduplication   = true
  visibility_timeout            = 300
  message_retention_seconds     = 604800

  enable_priority_queues = true

  create_dashboard = true
}

output "vpc_id" {
  value = module.networking.vpc_id
}

output "region" {
  value = "us-west-2"
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
