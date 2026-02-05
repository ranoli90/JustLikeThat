# =============================================================================
# Queue Module Outputs - Sprint 38
# =============================================================================

output "queue_url" {
  description = "Queue URL"
  value       = aws_sqs_queue.main.url
}

output "queue_arn" {
  description = "Queue ARN"
  value       = aws_sqs_queue.main.arn
}

output "queue_name" {
  description = "Queue name"
  value       = aws_sqs_queue.main.name
}

output "dlq_url" {
  description = "Dead letter queue URL"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "Dead letter queue ARN"
  value       = aws_sqs_queue.dlq.arn
}

output "dlq_name" {
  description = "Dead letter queue name"
  value       = aws_sqs_queue.dlq.name
}

output "high_priority_queue_url" {
  description = "High priority queue URL"
  value       = var.enable_priority_queues ? aws_sqs_queue.high_priority[0].url : ""
}

output "high_priority_queue_arn" {
  description = "High priority queue ARN"
  value       = var.enable_priority_queues ? aws_sqs_queue.high_priority[0].arn : ""
}

output "low_priority_queue_url" {
  description = "Low priority queue URL"
  value       = var.enable_priority_queues ? aws_sqs_queue.low_priority[0].url : ""
}

output "low_priority_queue_arn" {
  description = "Low priority queue ARN"
  value       = var.enable_priority_queues ? aws_sqs_queue.low_priority[0].arn : ""
}

output "is_fifo" {
  description = "Whether queue is FIFO"
  value       = var.fifo_queue
}

output "visibility_timeout" {
  description = "Visibility timeout"
  value       = var.visibility_timeout
}

output "message_retention_seconds" {
  description = "Message retention period"
  value       = var.message_retention_seconds
}

output "vault_secret_path" {
  description = "Vault secret path"
  value       = var.enable_vault_integration ? "${var.vault_mount_path}/data/${var.app_name}/queue/${var.environment}" : ""
}

output "queue_policy_arn" {
  description = "Queue policy ARN (for cross-account access)"
  value       = length(var.allowed_account_ids) > 0 ? aws_sqs_queue_policy.main[0].id : ""
}

output "all_queue_urls" {
  description = "All queue URLs"
  value       = concat(
    [aws_sqs_queue.main.url],
    [aws_sqs_queue.dlq.url],
    var.enable_priority_queues ? [aws_sqs_queue.high_priority[0].url, aws_sqs_queue.low_priority[0].url] : []
  )
}

output "all_queue_arns" {
  description = "All queue ARNs"
  value       = concat(
    [aws_sqs_queue.main.arn],
    [aws_sqs_queue.dlq.arn],
    var.enable_priority_queues ? [aws_sqs_queue.high_priority[0].arn, aws_sqs_queue.low_priority[0].arn] : []
  )
}
