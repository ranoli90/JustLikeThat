# =============================================================================
# Compute Module - Sprint 38
# EC2 Instances, Auto Scaling Groups, Load Balancers
# =============================================================================

# =============================================================================
# IAM Role for EC2 instances
# =============================================================================

resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-ec2-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-ec2-role-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# IAM Policy for Secrets Manager / Vault
resource "aws_iam_role_policy" "secrets_policy" {
  name = "${var.app_name}-secrets-policy-${var.environment}"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:secretsmanager:${var.region}:${var.account_id}:secret:${var.app_name}/*"
      },
      {
        Action = [
          "kms:Decrypt"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.sns_key.arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# IAM Policy for CloudWatch
resource "aws_iam_role_policy" "cloudwatch_policy" {
  name = "${var.app_name}-cloudwatch-policy-${var.environment}"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:logs:${var.region}:${var.account_id}:log-group:${var.app_name}-*:*"
      },
      {
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:cloudwatch:${var.region}:${var.account_id}:metric/*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-ec2-profile-${var.environment}"
  role = aws_iam_role.ec2_role.name
}

# =============================================================================
# Launch Template
# =============================================================================

resource "aws_launch_template" "main" {
  name_prefix   = "${var.app_name}-lt-${var.environment}"
  image_id      = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.security_group_id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    
    # Set hostname
    hostnamectl set-hostname ${var.app_name}-${var.environment}
    
    # Update system
    yum update -y
    
    # Install Docker
    amazon-linux-extras install docker -y
    systemctl start docker
    systemctl enable docker
    usermod -aG docker ec2-user
    
    # Install AWS CLI
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
    unzip -q /tmp/awscliv2.zip -d /tmp
    /tmp/aws/install
    
    # Install CloudWatch Agent
    wget -O /tmp/amazon-cloudwatch-agent.rpm https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -Uvh /tmp/amazon-cloudwatch-agent.rpm
    
    # Create app directory
    mkdir -p /opt/${var.app_name}
    chown -R ec2-user:ec2-user /opt/${var.app_name}
    
    # Configure log rotation
    cat > /etc/logrotate.d/${var.app_name} << 'LOGROTATE'
    /var/log/${var.app_name}/*.log {
      daily
      rotate 14
      compress
      delaycompress
      missingok
      notifempty
    }
    LOGROTATE
    
    # Start Docker container on boot
    systemctl enable docker
    
    echo "Instance initialization complete"
    EOF
  )

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  monitoring {
    enabled = var.enable_detailed_monitoring
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = var.root_volume_size
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  metadata_options {
    http_tokens               = "required"
    http_put_response_hop_limit = 2
    instance_metadata_tags    = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.app_name}-${var.environment}"
      Environment = var.environment
      Project     = var.app_name
      ManagedBy   = "terraform"
      Sprint      = "38"
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name        = "${var.app_name}-volume-${var.environment}"
      Environment = var.environment
      Project     = var.app_name
      ManagedBy   = "terraform"
      Sprint      = "38"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Auto Scaling Group
# =============================================================================

resource "aws_autoscaling_group" "main" {
  name_prefix               = "${var.app_name}-asg-${var.environment}"
  vpc_zone_identifier       = var.subnet_ids
  max_size                  = var.max_count
  min_size                  = var.min_count
  desired_capacity          = var.desired_count
  health_check_type         = "ELB"
  health_check_grace_period = var.health_check_grace_period
  target_group_arns         = [aws_lb_target_group.app.arn]

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  # Zero-downtime deployment: scaling policies
  dynamic "tag" {
    for_each = var.asg_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  # Lifecycle hooks for zero-downtime deployments
  dynamic "lifecycle_hook" {
    for_each = var.enable_lifecycle_hooks ? [{
      name                  = "${var.app_name}-scale-in-hook-${var.environment}"
      lifecycle_transition  = "EC2_INSTANCE_TERMINATING"
      heartbeat_timeout     = var.lifecycle_hook_timeout
      notification_target_arn = aws_sns.asg_notifications.arn
    }] : []
    content {
      name                = lifecycle_hook.value.name
      lifecycle_transition = lifecycle_hook.value.lifecycle_transition
      heartbeat_timeout   = lifecycle_hook.value.heartbeat_timeout
    }
  }

  # Instance termination policy
  termination_policies = ["OldestInstance", "Default"]

  # Mixed instances policy for spot instances
  mixed_instances_policy {
    instances_distribution {
      on_demand_percentage_above_base_capacity = var.on_demand_percentage
      spot_allocation_strategy                 = "capacity-optimized"
    }

    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.main.id
        version            = "$Latest"
      }

      dynamic "override" {
        for_each = var.instance_types
        content {
          instance_type = override.value
        }
      }
    }
  }

  # Metrics collection
  metrics_granularity = "1Minute"

  # Wait for ELB registration
  wait_for_elb_capacity = var.desired_count

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# KMS Key for SNS Encryption
# =============================================================================

resource "aws_kms_key" "sns_key" {
  description             = "KMS key for SNS encryption"
  enable_key_rotation     = true
  deletion_window_in_days  = 30

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
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-sns-key-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# WAFv2 Web ACL for ALB
# =============================================================================

resource "aws_wafv2_web_acl" "alb_acl" {
  name  = "${var.app_name}-alb-waf-${var.environment}"
  scope = "REGIONAL"

  default_action {
    allow {
      # Default allow - rules will block specific threats
    }
  }

  # AWS Managed Rules
  rule {
    name = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      sampled_requests_enabled = true
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.app_name}-alb-waf-common"
    }
  }

  rule {
    name = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      sampled_requests_enabled = true
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.app_name}-alb-waf-bad-inputs"
    }
  }

  rule {
    name = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      sampled_requests_enabled = true
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.app_name}-alb-waf-sqli"
    }
  }

  rule {
    name = "AWSManagedRulesLinuxRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      sampled_requests_enabled = true
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.app_name}-alb-waf-linux"
    }
  }

  visibility_config {
    sampled_requests_enabled = true
    cloudwatch_metrics_enabled = true
    metric_name               = "${var.app_name}-alb-waf"
  }

  tags = {
    Name        = "${var.app_name}-alb-waf-acl-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# SNS Topic for ASG Notifications
# =============================================================================

resource "aws_sns_topic" "asg_notifications" {
  name = "${var.app_name}-asg-notifications-${var.environment}"
  kms_master_key_id = aws_kms_key.sns_key.arn

  tags = {
    Name        = "${var.app_name}-asg-sns-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_sns_topic_subscription" "asg_email" {
  count = var.notification_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.asg_notifications.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "main" {
  name_prefix       = "${var.app_name}-alb-${var.environment}"
  internal          = var.alb_internal
  load_balancer_type = "application"
  security_groups   = [var.security_group_id]
  subnets           = var.subnet_ids

  enable_deletion_protection = var.environment == "prod"
  enable_http2               = true
  web_acl_id                 = aws_wafv2_web_acl.alb_acl.id

  access_logs {
    bucket  = var.alb_log_bucket
    prefix  = "alb/${var.environment}"
    enabled = true
  }

  tags = {
    Name        = "${var.app_name}-alb-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# ALB Target Group
resource "aws_lb_target_group" "app" {
  name_prefix          = "${var.app_name}-tg-${var.environment}"
  port                 = var.app_port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  deregistration_delay = var.deregistration_delay

  health_check {
    path                = var.health_check_path
    healthy_threshold   = var.healthy_threshold_count
    unhealthy_threshold = var.unhealthy_threshold_count
    timeout             = var.health_check_timeout
    interval            = var.health_check_interval
    matcher             = "200,301,302"
  }

  # Blue-Green Deployment support
  target_type = "instance"

  # Stickiness for zero-downtime
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }

  tags = {
    Name        = "${var.app_name}-tg-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Blue-Green Target Group
resource "aws_lb_target_group" "app_blue" {
  count = var.enable_blue_green_deployment ? 1 : 0

  name_prefix          = "${var.app_name}-tg-blue-${var.environment}"
  port                 = var.app_port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  deregistration_delay = var.deregistration_delay

  health_check {
    path                = var.health_check_path
    healthy_threshold   = var.healthy_threshold_count
    unhealthy_threshold = var.unhealthy_threshold_count
    timeout             = var.health_check_timeout
    interval            = var.health_check_interval
  }

  tags = {
    Name        = "${var.app_name}-tg-blue-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_lb_target_group" "app_green" {
  count = var.enable_blue_green_deployment ? 1 : 0

  name_prefix          = "${var.app_name}-tg-green-${var.environment}"
  port                 = var.app_port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  deregistration_delay = var.deregistration_delay

  health_check {
    path                = var.health_check_path
    healthy_threshold   = var.healthy_threshold_count
    unhealthy_threshold = var.unhealthy_threshold_count
    timeout             = var.health_check_timeout
    interval            = var.health_check_interval
  }

  tags = {
    Name        = "${var.app_name}-tg-green-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# ALB Listener - HTTP
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ALB Listener - HTTPS
resource "aws_lb_listener" "https" {
  count = var.enable_https ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = var.alb_ssl_policy
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ALB Listener Rule - Canary Deployment
resource "aws_lb_listener_rule" "canary" {
  count = var.enable_canary_deployment ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 10

  action {
    type = "forward"
    target_group_arn = aws_lb_target_group.app_blue[0].arn
  }

  condition {
    path_pattern {
      values = ["/canary/*"]
    }
  }
}

# =============================================================================
# Auto Scaling Policies
# =============================================================================

# Target Tracking Policy - CPU
resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "${var.app_name}-cpu-target-${var.environment}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.cpu_target_value
  }
}

# Target Tracking Policy - Memory
resource "aws_autoscaling_policy" "memory_target" {
  name                   = "${var.app_name}-memory-target-${var.environment}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageMemoryUtilization"
    }
    target_value = var.memory_target_value
  }
}

# Simple Scaling Policy - Custom Metric
resource "aws_autoscaling_policy" "request_count" {
  name                   = "${var.app_name}-request-count-${var.environment}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 120
  autoscaling_group_name = aws_autoscaling_group.main.name

  step_adjustment {
    scaling_adjustment          = 2
    metric_interval_lower_bound = 0
    metric_interval_upper_bound = 1000
  }

  step_adjustment {
    scaling_adjustment          = 4
    metric_interval_lower_bound = 1000
  }
}

# =============================================================================
# Scheduled Actions
# =============================================================================

# Scale up during business hours
resource "aws_autoscaling_schedule" "scale_up" {
  count = var.enable_scheduled_scaling ? 1 : 0

  scheduled_action_name = "${var.app_name}-scale-up-${var.environment}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  min_size              = var.min_count
  max_size              = var.max_count
  desired_capacity     = var.desired_count

  recurrence = var.scale_up_schedule
}

resource "aws_autoscaling_schedule" "scale_down" {
  count = var.enable_scheduled_scaling ? 1 : 0

  scheduled_action_name = "${var.app_name}-scale-down-${var.environment}"
  autoscaling_group_name = aws_autoscaling_group.main.name
  min_size              = var.min_count
  max_size              = var.max_count
  desired_capacity     = var.min_count

  recurrence = var.scale_down_schedule
}
