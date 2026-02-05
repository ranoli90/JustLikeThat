# Multi-Region Deployment Terraform Module
# Configures deployment across AWS, GCP, and Azure regions

variable "environment" {
  description = "Deployment environment (production, staging)"
  type        = string
}

variable "aws_regions" {
  description = "AWS regions to deploy to"
  type        = list(string)
  default     = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
}

variable "gcp_regions" {
  description = "GCP regions to deploy to"
  type        = list(string)
  default     = ["us-central1", "europe-west1", "asia-northeast1"]
}

variable "azure_regions" {
  description = "Azure regions to deploy to"
  type        = list(string)
  default     = ["East US", "West Europe", "Southeast Asia"]
}

variable "primary_region" {
  description = "Primary region for writes"
  type        = string
  default     = "us-east-1"
}

variable "replica_regions" {
  description = "Regions for read replicas"
  type        = list(string)
  default     = ["us-west-2", "eu-west-1"]
}

# AWS Provider Configuration
provider "aws" {
  alias  = "aws-primary"
  region = var.primary_region
}

# GCP Provider Configuration
provider "google" {
  alias  = "gcp-primary"
  region = "us-central1"
}

# Azure Provider Configuration
azurerm = {
  features = {}
}

# VPC for each AWS region
resource "aws_vpc" "main" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.value == var.primary_region ? "aws-primary" : "aws-other"}
  
  cidr_block           = cidrsubnet("10.0.0.0/16", 8, index(var.aws_regions, each.value))
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "${var.environment}-vpc-${each.value}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Subnets for each VPC
resource "aws_subnet" "public" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.value == var.primary_region ? "aws-primary" : "aws-other"}
  
  vpc_id                  = aws_vpc.main[each.key].id
  cidr_block              = cidrsubnet(aws_vpc.main[each.key].cidr_block, 4, 0)
  availability_zone       = "${each.value}a"
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.environment}-public-${each.value}a"
    Environment = var.environment
    Type        = "public"
  }
}

resource "aws_subnet" "private" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.value == var.primary_region ? "aws-primary" : "aws-other"}
  
  vpc_id                  = aws_vpc.main[each.key].id
  cidr_block              = cidrsubnet(aws_vpc.main[each.key].cidr_block, 4, 1)
  availability_zone       = "${each.value}a"
  map_public_ip_on_launch = false
  
  tags = {
    Name        = "${var.environment}-private-${each.value}a"
    Environment = var.environment
    Type        = "private"
  }
}

# EKS Clusters
resource "aws_eks_cluster" "main" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.value == var.primary_region ? "aws-primary" : "aws-other"}
  
  name     = "${var.environment}-eks-${each.value}"
  role_arn = aws_iam_role.eks_cluster[each.key].arn
  
  vpc_config {
    subnet_ids = [aws_subnet.public[each.key].id, aws_subnet.private[each.key].id]
  }
  
  depends_on = [aws_iam_role.eks_cluster]
}

# IAM Roles for EKS
resource "aws_iam_role" "eks_cluster" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.value == var.primary_region ? "aws-primary" : "aws-other"}
  
  name = "${var.environment}-eks-role-${each.value}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

# Route53 Health Checks for failover
resource "aws_route53_health_check" "primary" {
  for_each               = toset(var.aws_regions)
  fqdn                    = "api.${var.environment}.apply-as-a-service.com"
  port                    = 443
  type                    = "HTTPS"
  resource_path            = "/health"
  failure_threshold        = 3
  request_interval         = 30
  
  tags = {
    Name        = "${var.environment}-health-${each.value}"
    Environment = var.environment
  }
}

# Route53 Failover Records
resource "aws_route53_record" "primary" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.environment}.apply-as-a-service.com"
  type    = "A"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  set_identifier  = "primary-${var.primary_region}"
  health_check_id = aws_route53_health_check.primary[var.primary_region].id
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "secondary" {
  for_each = toset(var.replica_regions)
  
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.environment}.apply-as-a-service.com"
  type    = "A"
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  set_identifier  = "secondary-${each.value}"
  health_check_id = aws_route53_health_check.primary[each.value].id
  
  alias {
    name                   = aws_lb.main[each.key].dns_name
    zone_id                = aws_lb.main[each.key].zone_id
    evaluate_target_health = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  for_each = toset(var.aws_regions)
  provider = aws.${each.value == var.primary_region ? "aws-primary" : "aws-other"}
  
  name               = "${var.environment}-alb-${each.value}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [aws_subnet.public[each.key].id]
  
  enable_deletion_protection = var.environment == "production"
  
  tags = {
    Name        = "${var.environment}-alb-${each.value}"
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "${var.environment}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main[var.primary_region].id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Outputs
output "cluster_endpoints" {
  description = "EKS cluster endpoints"
  value = {
    for region in var.aws_regions :
    region => aws_eks_cluster.main[region].endpoint
  }
}

output "vpc_ids" {
  description = "VPC IDs by region"
  value = {
    for region in var.aws_regions :
    region => aws_vpc.main[region].id
  }
}

output "load_balancer_dns" {
  description = "Load balancer DNS names"
  value = {
    for region in var.aws_regions :
    region => aws_lb.main[region].dns_name
  }
}
