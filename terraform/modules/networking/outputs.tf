# =============================================================================
# Networking Module Outputs - Sprint 38
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "subnet_ids" {
  description = "List of all subnet IDs"
  value       = concat(aws_subnet.public.*.id, aws_subnet.private.*.id)
}

output "subnet_public_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public.*.id
}

output "subnet_private_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private.*.id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "security_group_id" {
  description = "App security group ID"
  value       = aws_security_group.app.id
}

output "security_group_name" {
  description = "App security group name"
  value       = aws_security_group.app.name
}

output "security_group_db_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "security_group_cache_id" {
  description = "Cache security group ID"
  value       = aws_security_group.cache.id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[0].id : ""
}

output "route_table_public_id" {
  description = "Public route table ID"
  value       = aws_route_table.public.id
}

output "route_table_private_id" {
  description = "Private route table ID"
  value       = var.enable_nat_gateway ? aws_route_table.private[0].id : ""
}

output "vpc_endpoint_s3_id" {
  description = "S3 VPC endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "vpc_endpoint_dynamodb_id" {
  description = "DynamoDB VPC endpoint ID"
  value       = aws_vpc_endpoint.dynamodb.id
}

output "network_acl_id" {
  description = "Network ACL ID"
  value       = aws_network_acl.main.id
}

output "az_count" {
  description = "Number of availability zones"
  value       = length(var.availability_zones)
}
