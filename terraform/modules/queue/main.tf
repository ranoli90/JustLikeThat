# =============================================================================
# Queue Module - Sprint 38
# SQS Queues with Dead Letter Queue, FIFO Support, and Vault Integration
# =============================================================================

# =============================================================================
# Main Queue
# =============================================================================

resource "aws_sqs_queue" "main" {
  name                      = var.queue_name
  fifo_queue                = var.fifo_queue
  content_based_deduplication = var.content_based_deduplication

  # Visibility timeout
  visibility_timeout_seconds = var.visibility_timeout

  # Message retention
  message_retention_seconds = var.message_retention_seconds

  # Receive message wait time
  receive_wait_time_seconds = var.receive_wait_time_seconds

  # Redrive policy (DLQ)
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  # Encryption at rest
  sqs_managed_sse_enabled = var.sse_enabled

  # Tags
  tags = {
    Name        = var.queue_name
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    Type        = "main"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Dead Letter Queue
# =============================================================================

resource "aws_sqs_queue" "dlq" {
  name                      = "${var.queue_name}-dlq"
  fifo_queue                = var.fifo_queue

  # DLQ doesn't need redrive
  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds = var.dlq_retention_seconds

  # Encryption at rest
  sqs_managed_sse_enabled = var.sse_enabled

  tags = {
    Name        = "${var.queue_name}-dlq"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    Type        = "dlq"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Priority Queues (for different job priorities)
# =============================================================================

resource "aws_sqs_queue" "high_priority" {
  count = var.enable_priority_queues ? 1 : 0

  name                      = "${var.queue_name}-high"
  fifo_queue                = var.fifo_queue
  content_based_deduplication = true

  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds = var.message_retention_seconds
  receive_wait_time_seconds = var.receive_wait_time_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  sqs_managed_sse_enabled = var.sse_enabled

  tags = {
    Name        = "${var.queue_name}-high"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    Priority    = "high"
  }
}

resource "aws_sqs_queue" "low_priority" {
  count = var.enable_priority_queues ? 1 : 0

  name                      = "${var.queue_name}-low"
  fifo_queue                = var.fifo_queue
  content_based_deduplication = true

  visibility_timeout_seconds = var.visibility_timeout
  message_retention_seconds = var.message_retention_seconds
  receive_wait_time_seconds = var.receive_wait_time_seconds

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = var.max_receive_count
  })

  sqs_managed_sse_enabled = var.sse_enabled

  tags = {
    Name        = "${var.queue_name}-low"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    Priority    = "low"
  }
}

# =============================================================================
# SQS Queue Policy (for cross-account access)
# =============================================================================

resource "aws_sqs_queue_policy" "main" {
  count = length(var.allowed_account_ids) > 0 ? 1 : 0

  queue_url = aws_sqs_queue.main.id
  policy    = jsonencode({
    Version = "2012-10-17"
    Id      = "${var.queue_name}-policy"
    Statement = [
      {
        Sid       = "AllowCrossAccountAccess"
        Effect    = "Allow"
        Principal = "*"
        Action    = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueUrl",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.main.arn
        Condition = {
          ArnEquals = {
            "aws:SourceAccount" = var.allowed_account_ids
          }
        }
      }
    ]
  })
}

# =============================================================================
# CloudWatch Alarms
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "queue_messages_visible" {
  alarm_name          = "${var.queue_name}-messages-visible-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alarm_threshold

  dimensions = {
    QueueName = aws_sqs_queue.main.name
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.queue_name}-messages-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "queue_messages_in_flight" {
  alarm_name          = "${var.queue_name}-messages-inflight-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "ApproximateNumberOfMessagesNotVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = var.alarm_threshold

  dimensions = {
    QueueName = aws_sqs_queue.main.name
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.queue_name}-inflight-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "queue_age" {
  alarm_name          = "${var.queue_name}-oldest-message-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 5
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Maximum"
  threshold           = var.max_age_threshold

  dimensions = {
    QueueName = aws_sqs_queue.main.name
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.queue_name}-age-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.queue_name}-dlq-messages-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 0

  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }

  alarm_actions = var.alarm_actions
  okactions     = var.alarm_actions

  tags = {
    Name        = "${var.queue_name}-dlq-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# SQS Metrics Dashboard
# =============================================================================

resource "aws_cloudwatch_dashboard" "queue_dashboard" {
  count = var.create_dashboard ? 1 : 0

  dashboard_name = "${var.queue_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "Queue Messages"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.main.name],
            ["AWS/SQS", "ApproximateNumberOfMessagesNotVisible", "QueueName", aws_sqs_queue.main.name]
          ]
          period = 300
          stat   = "Sum"
          region = var.region
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title = "DLQ Messages"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.dlq.name]
          ]
          period = 60
          stat   = "Sum"
          region = var.region
        }
      }
    ]
  })
}

# =============================================================================
# Vault Integration
# =============================================================================

resource "vault_kv_secret_v2" "queue" {
  count = var.enable_vault_integration ? 1 : 0

  mount = var.vault_mount_path
  name  = "${var.app_name}/queue/${var.environment}"

  data = {
    queue_url  = aws_sqs_queue.main.url
    queue_arn  = aws_sqs_queue.main.arn
    queue_name = aws_sqs_queue.main.name
    dlq_url    = aws_sqs_queue.dlq.url
    dlq_arn    = aws_sqs_queue.dlq.arn
  }
}
