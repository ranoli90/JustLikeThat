# Apply-as-a-Service Platform - Sprint 38 Deployment Guide

## Overview
This document describes the deployment process for the Apply-as-a-Service platform using Sprint 38 DevOps & Infrastructure automation.

## Architecture

### Infrastructure Components
- **VPC**: Multi-AZ network with public/private subnets
- **Compute**: Auto Scaling Groups with Load Balancers
- **Database**: RDS PostgreSQL with Multi-AZ and read replicas
- **Cache**: ElastiCache Redis cluster
- **Queue**: SQS with dead letter queue

### Environments
| Environment | Purpose | Configuration |
|------------|---------|---------------|
| dev | Development | Single AZ, minimal resources |
| staging | Pre-production testing | Multi-AZ, production-like |
| prod | Production | Full HA, all features |
| sandbox | Feature testing | Isolated, flexible |
| dr | Disaster recovery | Cross-region, read-only |

## Prerequisites

### Required Tools
- AWS CLI v2
- Terraform v1.5.7+
- kubectl v1.27+
- Helm v3.12+
- ArgoCD CLI

### Required Permissions
- AWS IAM user with Terraform permissions
- GitHub repository admin (for secrets)
- Kubernetes cluster admin

## Deployment Steps

### 1. Initialize Terraform Backend

```bash
# Configure AWS credentials
aws configure

# Initialize Terraform
cd terraform/environments/{environment}
terraform init -reconfigure \
  -backend-config="bucket=apply-as-a-service-terraform-state" \
  -backend-config="key={environment}/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=terraform-state-locking"
```

### 2. Plan Infrastructure Changes

```bash
# Review planned changes
terraform plan -out=tfplan \
  -var="environment={environment}" \
  -var="aws_region=us-east-1"
```

### 3. Apply Infrastructure

```bash
# Apply changes (requires approval for prod)
terraform apply tfplan
```

### 4. Configure Kubernetes

```bash
# Update kubeconfig
aws eks update-kubeconfig --name apply-as-a-service-{environment}

# Apply Kubernetes manifests
kubectl apply -f k8s/namespaces/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/deployments/
```

### 5. Deploy with ArgoCD

```bash
# Login to ArgoCD
argocd login --core

# Create applications
kubectl apply -f argocd/applications/

# Sync applications
argocd app sync backend-{environment}
```

## Zero-Downtime Deployment

### Rolling Updates
- **Strategy**: RollingUpdate with maxSurge=1, maxUnavailable=0
- **Health Checks**: Liveness, readiness, and startup probes
- **Graceful Termination**: 30-second termination grace period

### Blue-Green Deployment
```yaml
# Target group weights
blue:
  weight: 100
  target: blue-alb
green:
  weight: 0
  target: green-alb
```

### Canary Deployment
```yaml
# Progressive rollout
canary:
  initial_weight: 10
  increment: 10
  interval: 5m
  final_weight: 100
```

## Secret Management

### HashiCorp Vault Integration
```bash
# Initialize Vault
vault operator init

# Enable secrets engine
vault secrets enable -path=secret kv-v2

# Create database credentials
vault kv put secret/apply-as-a-service/database/prod \
  host=prod-db.example.com \
  username=admin \
  password=secure_password

# Configure Kubernetes auth
vault auth enable kubernetes
vault write auth/kubernetes/config \
  kubernetes_host=https://kubernetes.default.svc
```

### Secret Rotation
- **Automatic**: 24-hour default rotation
- **Manual**: Via Vault CLI or API

## CI/CD Pipeline

### GitHub Actions Workflows

#### CI Pipeline (ci.yml)
1. Code quality checks
2. Unit tests
3. Security scanning
4. Docker image build
5. Push to ECR

#### CD Pipeline (cd.yml)
1. Terraform plan
2. Manual approval (prod)
3. Terraform apply
4. Application deployment
5. Health checks
6. Auto-rollback on failure

## Monitoring & Observability

### CloudWatch Metrics
- EC2: CPU, memory, network
- RDS: Connections, latency, IOPS
- ElastiCache: CPU, memory, evictions
- SQS: Queue depth, message age

### Alerts
- High CPU (>80%)
- High memory (>75%)
- Database connections (>80%)
- Queue depth (>1000)
- Dead letter queue messages

## Rollback Procedures

### Terraform Rollback
```bash
# Previous state
terraform state pull | jq '.resources[] | select(.type=="aws_instance") | .name'
terraform apply -target=aws_instance.previous_instance
```

### Application Rollback
```bash
# Kubernetes rollback
kubectl rollout undo deployment/backend -n {environment}

# Or revert to previous image
kubectl set image deployment/backend backend=previous-image:tag -n {environment}
```

### Database Rollback
```bash
# Point-in-time recovery
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier prod-db \
  --target-db-instance-name prod-db-restore \
  --restore-time 2024-01-15T12:00:00Z
```

## Cost Optimization

### Reserved Instances
- Database: 3-year reserved
- Cache: 1-year reserved
- Compute: Spot instances for dev

### Resource Optimization
- Right-sizing recommendations
- Auto-scaling policies
- Scheduled scaling for non-prod

## Security

### Compliance
- SOC 2 Type II ready
- PCI-DSS compliant
- GDPR compliant

### Security Controls
- KMS encryption at rest
- TLS 1.3 in transit
- VPC isolation
- IAM least privilege
- CloudTrail logging
- SecurityHub integration

## Troubleshooting

### Common Issues

#### Terraform State Lock
```bash
# Check state
terraform state list

# Unlock
terraform force-unlock {lock_id}
```

#### Pod CrashLoopBackOff
```bash
# Check logs
kubectl logs deployment/backend -n {environment} --previous

# Check events
kubectl describe pod backend-xxx -n {environment}
```

#### Database Connection Issues
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxx

# Test connection
psql -h db-host -U user -d database
```

## Support

### Contacts
- Platform Team: platform@apply-as-a-service.io
- On-call: +1 (555) 123-4567
- Slack: #platform-support

### Documentation
- [Architecture](Apply-as-a-Service-V1-Architecture.md)
- [API Documentation](https://api.apply-as-a-service.io/docs)
- [Runbooks](https://wiki.apply-as-a-service.io/runbooks)
