# =============================================================================
# Compute Module Outputs - Sprint 38
# =============================================================================

output "instance_ids" {
  description = "List of EC2 instance IDs"
  value       = aws_autoscaling_group.main.instance_ids
}

output "instance_ips" {
  description = "List of instance public IPs"
  value       = aws_autoscaling_group.main.instance_ids
}

output "launch_template_id" {
  description = "Launch template ID"
  value       = aws_launch_template.main.id
}

output "launch_template_name" {
  description = "Launch template name"
  value       = aws_launch_template.main.name
}

output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.main.name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.main.arn
}

output "asg_desired_capacity" {
  description = "ASG desired capacity"
  value       = aws_autoscaling_group.main.desired_capacity
}

output "asg_max_size" {
  description = "ASG max size"
  value       = aws_autoscaling_group.main.max_size
}

output "asg_min_size" {
  description = "ASG min size"
  value       = aws_autoscaling_group.main.min_size
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_lb.main.security_groups
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.app.arn
}

output "target_group_arn_blue" {
  description = "Blue target group ARN"
  value       = var.enable_blue_green_deployment ? aws_lb_target_group.app_blue[0].arn : ""
}

output "target_group_arn_green" {
  description = "Green target group ARN"
  value       = var.enable_blue_green_deployment ? aws_lb_target_group.app_green[0].arn : ""
}

output "listener_http_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "listener_https_arn" {
  description = "HTTPS listener ARN"
  value       = var.enable_https ? aws_lb_listener.https[0].arn : ""
}

output "iam_role_arn" {
  description = "IAM role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "iam_instance_profile_arn" {
  description = "IAM instance profile ARN"
  value       = aws_iam_instance_profile.ec2_profile.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for ASG notifications"
  value       = aws_sns_topic.asg_notifications.arn
}
