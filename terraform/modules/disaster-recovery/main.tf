# Disaster Recovery Terraform Module
# Configures automated backups, failover, and DR testing infrastructure

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "primary_region" {
  description = "Primary region"
  type        = string
}

variable "secondary_regions" {
  description = "Secondary regions for DR"
  type        = list(string)
  default     = ["us-west-2", "eu-west-1"]
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "rto_minutes" {
  description = "Recovery Time Objective in minutes"
  type        = number
  default     = 15
}

variable "rpo_minutes" {
  description = "Recovery Point Objective in minutes"
  type        = number
  default     = 5
}

# S3 Bucket for Cross-Region Backups
resource "aws_s3_bucket" "dr_backups" {
  bucket = "${var.environment}-dr-backups-${var.primary_region}"
  
  versioning {
    enabled = true
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  
  lifecycle_rule {
    enabled = true
    expiration {
      days = var.backup_retention_days
    }
    transition {
      days          = 7
      storage_class = "STANDARD_IA"
    }
    transition {
      days          = 30
      storage_class = "GLACIER"
    }
  }
  
  # Cross-region replication
  replication_configuration {
    role = aws_iam_role.replication.arn
    
    rules {
      id     = "dr-replication"
      status = "Enabled"
      
      destination {
        bucket        = aws_s3_bucket.dr_backups_replica[0].arn
        storage_class = "STANDARD"
        replica_kms_key_id = aws_kms_key.replication_key.arn
      }
    }
  }
}

# Replica Bucket in Secondary Region
resource "aws_s3_bucket" "dr_backups_replica" {
  count  = length(var.secondary_regions) > 0 ? 1 : 0
  bucket = "${var.environment}-dr-backups-${var.secondary_regions[0]}"
  provider = aws.secondary
  
  versioning {
    enabled = true
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# KMS Key for Backup Encryption
resource "aws_kms_key" "dr_key" {
  description = "KMS key for DR backups"
  
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
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })
}

# Replication IAM Role
resource "aws_iam_role" "replication" {
  name = "${var.environment}-s3-replication-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

# DynamoDB Table for Failover State
resource "aws_dynamodb_table" "failover_state" {
  name         = "${var.environment}-failover-state"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "region"
  range_key    = "timestamp"
  
  attribute {
    name = "region"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "S"
  }
  
  ttl {
    attribute_name = "expires_at"
    enabled         = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name        = "${var.environment}-failover-state"
    Environment = var.environment
  }
}

# SNS Topic for DR Notifications
resource "aws_sns_topic" "dr_alerts" {
  name = "${var.environment}-dr-alerts"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action = "sns:Publish"
        Resource = aws_sns_topic.dr_alerts.arn
      }
    ]
  })
}

# CloudWatch Events for DR Monitoring
resource "aws_cloudwatch_event_rule" "dr_failure" {
  name        = "${var.environment}-dr-failure-detected"
  description = "Detect potential DR scenarios"
  
  event_pattern = jsonencode({
    source = ["aws.ec2", "aws.ecs", "aws.rds"]
    detail-type = ["EC2 Instance State-change Notification", "ECS Service Action"]
    detail = {
      state = ["stopped", "running"]
    }
  })
}

resource "aws_cloudwatch_event_target" "dr_failure" {
  rule      = aws_cloudwatch_event_rule.dr_failure.name
  target_id = "Invoke Lambda for DR Check"
  arn       = aws_lambda_function.dr_check.arn
}

# Lambda Function for DR Checks
resource "aws_lambda_function" "dr_check" {
  filename      = "lambda-dr-check.zip"
  function_name = "${var.environment}-dr-check"
  role          = aws_iam_role.lambda_dr_check.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  
  timeout = 300
  
  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.dr_alerts.arn
      DYNAMODB_TABLE = aws_dynamodb_table.failover_state.name
      RTO_MINUTES    = var.rto_minutes
      RPO_MINUTES    = var.rpo_minutes
    }
  }
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_dr_check" {
  name = "${var.environment}-lambda-dr-check"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda Policy
resource "aws_iam_role_policy" "lambda_dr_check" {
  name = "${var.environment}-lambda-dr-check-policy"
  role = aws_iam_role.lambda_dr_check.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.failover_state.arn
      },
      {
        Effect = "Allow"
        Action = "sns:Publish"
        Resource = aws_sns_topic.dr_alerts.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeVpcs",
          "ecs:DescribeServices"
        ]
        Resource = "*"
      }
    ]
  })
}

# Scheduled Backup Lambda
resource "aws_lambda_function" "backup_trigger" {
  filename      = "lambda-backup-trigger.zip"
  function_name = "${var.environment}-backup-trigger"
  role          = aws_iam_role.lambda_backup.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  
  environment {
    variables = {
      BACKUP_BUCKET = aws_s3_bucket.dr_backups.id
      DYNAMODB_TABLE = aws_dynamodb_table.failover_state.name
    }
  }
}

# CloudWatch Event for Hourly Backups
resource "aws_cloudwatch_event_rule" "hourly_backup" {
  name        = "${var.environment}-hourly-backup"
  description = "Trigger hourly backups"
  
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "hourly_backup" {
  rule      = aws_cloudwatch_event_rule.hourly_backup.name
  target_id = "Trigger Backup Lambda"
  arn       = aws_lambda_function.backup_trigger.arn
}

# Lambda Backup Role
resource "aws_iam_role" "lambda_backup" {
  name = "${var.environment}-lambda-backup"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Backup Policy
resource "aws_iam_role_policy" "lambda_backup" {
  name = "${var.environment}-lambda-backup-policy"
  role = aws_iam_role.lambda_backup.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.dr_backups.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:Backup",
          "dynamodb:Restore"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "rds:CreateDBSnapshot",
          "rds:CopyDBSnapshot",
          "rds:DescribeDBSnapshots"
        ]
        Resource = "*"
      }
    ]
  })
}

# Outputs
output "backup_bucket" {
  description = "S3 bucket for DR backups"
  value       = aws_s3_bucket.dr_backups.id
}

output "dr_alerts_topic" {
  description = "SNS topic for DR alerts"
  value       = aws_sns_topic.dr_alerts.arn
}

output "failover_table" {
  description = "DynamoDB table for failover state"
  value       = aws_dynamodb_table.failover_state.name
}
