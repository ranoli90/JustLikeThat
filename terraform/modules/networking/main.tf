# =============================================================================
# Networking Module - Sprint 38
# VPC, Subnets, Security Groups, NAT Gateways
# =============================================================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.app_name}-vpc-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-igw-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-public-${count.index + 1}-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    SubnetType  = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = false

  tags = {
    Name        = "${var.app_name}-private-${count.index + 1}-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
    SubnetType  = "private"
  }
}

# NAT Gateways (one per public subnet)
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? 1 : 0

  domain = "vpc"

  tags = {
    Name        = "${var.app_name}-nat-eip-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name        = "${var.app_name}-nat-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.app_name}-public-rt-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Private Route Table
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  count = var.enable_nat_gateway ? 1 : 0

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[0].id
  }

  tags = {
    Name        = "${var.app_name}-private-rt-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.enable_nat_gateway ? aws_route_table.private[0].id : aws_route_table.public.id
}

# =============================================================================
# Security Groups
# =============================================================================

# Security Group for Application
resource "aws_security_group" "app" {
  name        = "${var.app_name}-sg-${var.environment}"
  description = "Security group for ${var.app_name} ${var.environment} environment"
  vpc_id      = aws_vpc.main.id

  # Inbound rules
  dynamic "ingress" {
    for_each = var.security_group_ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }

  # Outbound rules
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-sg-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Security Group for Database
resource "aws_security_group" "database" {
  name        = "${var.app_name}-db-sg-${var.environment}"
  description = "Security group for ${var.app_name} database ${var.environment}"
  vpc_id      = aws_vpc.main.id

  # Allow PostgreSQL from app security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "PostgreSQL from app servers"
  }

  # Allow PostgreSQL from specific CIDR for admin
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.admin_cidr_blocks
    description = "PostgreSQL from admin IPs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-db-sg-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# Security Group for Cache (Redis)
resource "aws_security_group" "cache" {
  name        = "${var.app_name}-cache-sg-${var.environment}"
  description = "Security group for ${var.app_name} cache ${var.environment}"
  vpc_id      = aws_vpc.main.id

  # Allow Redis from app security group
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "Redis from app servers"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-cache-sg-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# VPC Endpoints
# =============================================================================

# S3 VPC Endpoint
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.region}.s3"
  route_table_ids = concat(
    [aws_route_table.public.id],
    var.enable_nat_gateway ? [aws_route_table.private[0].id] : []
  )

  tags = {
    Name        = "${var.app_name}-s3-endpoint-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# DynamoDB VPC Endpoint (for state locking)
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.region}.dynamodb"
  route_table_ids = concat(
    [aws_route_table.public.id],
    var.enable_nat_gateway ? [aws_route_table.private[0].id] : []
  )

  tags = {
    Name        = "${var.app_name}-dynamodb-endpoint-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# ECR API VPC Endpoint
resource "aws_vpc_endpoint" "ecr_api" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private.*.id
  security_group_ids  = [aws_security_group.app.id]

  tags = {
    Name        = "${var.app_name}-ecr-api-endpoint-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# ECR Docker VPC Endpoint
resource "aws_vpc_endpoint" "ecr_dkr" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private.*.id
  security_group_ids  = [aws_security_group.app.id]

  tags = {
    Name        = "${var.app_name}-ecr-dkr-endpoint-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# CloudWatch Logs VPC Endpoint
resource "aws_vpc_endpoint" "logs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.region}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private.*.id
  security_group_ids  = [aws_security_group.app.id]

  tags = {
    Name        = "${var.app_name}-logs-endpoint-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# Network ACLs (optional, using default)
# =============================================================================

resource "aws_network_acl" "main" {
  vpc_id = aws_vpc.main.id
  subnet_ids = concat(
    aws_subnet.public.*.id,
    aws_subnet.private.*.id
  )

  # Allow HTTP/HTTPS from anywhere
  ingress {
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 443
    protocol   = "tcp"
  }

  # Allow SSH from admin CIDR
  ingress {
    rule_no    = 200
    action     = "allow"
    cidr_block = var.admin_cidr_blocks[0]
    from_port  = 22
    to_port    = 22
    protocol   = "tcp"
  }

  # Allow all traffic within VPC
  ingress {
    rule_no    = 300
    action     = "allow"
    cidr_block = var.cidr_block
    from_port  = 0
    to_port    = 65535
    protocol   = "tcp"
  }

  # Allow all outbound
  egress {
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 65535
    protocol   = "tcp"
  }

  tags = {
    Name        = "${var.app_name}-nacl-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}

# =============================================================================
# VPC Peering (optional, for multi-region)
# =============================================================================

resource "aws_vpc_peering_connection" "peer" {
  count = var.enable_vpc_peering ? 1 : 0

  vpc_id        = aws_vpc.main.id
  peer_vpc_id   = var.peer_vpc_id
  peer_owner_id = var.peer_owner_id

  auto_accept = true

  tags = {
    Name        = "${var.app_name}-peering-${var.environment}"
    Environment = var.environment
    Project     = var.app_name
    ManagedBy   = "terraform"
    Sprint      = "38"
  }
}
