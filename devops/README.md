# DevOps Templates

Comprehensive DevOps templates for modern application deployment, monitoring, and infrastructure management.

## Overview

This collection provides production-ready DevOps configurations including:

- **CI/CD Pipelines** - GitHub Actions, GitLab CI, Jenkins, Azure DevOps
- **Container Orchestration** - Docker, Kubernetes, Docker Compose
- **Infrastructure as Code** - Terraform, Ansible, CloudFormation
- **Monitoring & Observability** - Prometheus, Grafana, ELK Stack, Jaeger
- **Security** - Container scanning, secrets management, compliance
- **Deployment Strategies** - Blue-Green, Canary, Rolling deployments

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Kubernetes cluster access
- Git
- Basic understanding of DevOps concepts

### Directory Structure

```
devops/
├── ci-cd/                  # CI/CD pipeline configurations
│   ├── github-actions.yml  # GitHub Actions workflow
│   ├── gitlab-ci.yml      # GitLab CI pipeline
│   ├── jenkins/           # Jenkins pipeline files
│   └── azure-pipelines.yml
├── docker/                # Container configurations
│   ├── Dockerfile         # Production Dockerfile
│   ├── Dockerfile.dev     # Development Dockerfile
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
├── kubernetes/            # Kubernetes manifests
│   ├── deployment.yaml    # Application deployment
│   ├── service.yaml       # Service definitions
│   ├── ingress.yaml       # Ingress configuration
│   └── monitoring/        # Monitoring stack
├── terraform/             # Infrastructure as Code
│   ├── aws/              # AWS infrastructure
│   ├── azure/            # Azure infrastructure
│   └── gcp/              # Google Cloud infrastructure
├── monitoring/            # Observability stack
│   ├── prometheus.yml     # Prometheus configuration
│   ├── grafana/          # Grafana dashboards
│   └── alertmanager/     # Alert configurations
├── scripts/              # Automation scripts
│   ├── deploy.sh         # Deployment script
│   ├── backup.sh         # Backup automation
│   └── health-check.sh   # Health checking
└── security/             # Security configurations
    ├── policies/         # Security policies
    └── scanning/         # Security scanning tools
```

## CI/CD Pipelines

### GitHub Actions

Complete workflow with:
- Security scanning (CodeQL, Trivy)
- Multi-environment testing
- Automated deployments
- Performance testing
- Notifications

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

### GitLab CI

Enterprise-grade pipeline featuring:
- Parallel testing strategies
- Container scanning
- Multi-stage deployments
- Artifact management
- Compliance reporting

```yaml
# .gitlab-ci.yml
stages:
  - security
  - test
  - build
  - deploy
```

### Key Features
- **Multi-environment support** (dev, staging, production)
- **Security-first approach** with scanning and compliance
- **Automated testing** including unit, integration, and E2E
- **Zero-downtime deployments** with rollback capabilities
- **Comprehensive monitoring** and alerting

## Container Strategy

### Production Dockerfile

Multi-stage build optimized for:
- **Security** - Non-root user, minimal attack surface
- **Performance** - Optimized layers, efficient caching
- **Size** - Minimal base images, dependency optimization
- **Observability** - Health checks, logging, metrics

```dockerfile
FROM node:18-alpine AS builder
# Build stage with optimizations

FROM node:18-alpine AS production
# Production stage with security hardening
```

### Development Environment

Complete development stack with:
- **Hot reloading** for rapid development
- **Service dependencies** (databases, caches, queues)
- **Development tools** (debuggers, profilers)
- **Consistent environments** across team members

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up
```

### Production Orchestration

Production-ready configuration featuring:
- **High availability** with multiple replicas
- **Load balancing** with Nginx
- **Data persistence** with named volumes
- **Health monitoring** and auto-restart
- **Resource limits** and optimization

## Kubernetes Deployment

### Core Components

- **Deployments** with rolling updates and health checks
- **Services** for load balancing and service discovery
- **Ingress** for external traffic routing
- **ConfigMaps** and **Secrets** for configuration management
- **HPA** (Horizontal Pod Autoscaler) for auto-scaling
- **Network Policies** for security

### Security Features

- **RBAC** (Role-Based Access Control)
- **Pod Security Policies**
- **Network segmentation**
- **Secret encryption at rest**
- **Container security contexts**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
```

## Monitoring & Observability

### Prometheus Stack

Comprehensive monitoring with:
- **Application metrics** (custom and standard)
- **Infrastructure metrics** (CPU, memory, disk, network)
- **Service metrics** (databases, caches, queues)
- **Business metrics** (user activity, revenue, errors)

### Grafana Dashboards

Pre-built dashboards for:
- **Application Performance Monitoring**
- **Infrastructure Overview**
- **Database Performance**
- **Security Monitoring**
- **Business Intelligence**

### Alerting

Smart alerting with:
- **Tiered alert severity** (info, warning, critical)
- **Alert routing** to appropriate teams
- **Runbook automation** for common issues
- **Alert suppression** to reduce noise

### Logging Strategy

Centralized logging with:
- **Structured logging** (JSON format)
- **Log aggregation** (ELK/EFK stack)
- **Log retention policies**
- **Real-time log analysis**
- **Compliance logging**

## Deployment Strategies

### Rolling Deployment

```bash
./scripts/deploy.sh \
  --environment production \
  --type rolling \
  --version v1.2.3
```

**Benefits:**
- ✅ Zero downtime
- ✅ Gradual rollout
- ✅ Easy rollback
- ⚠️ Mixed versions during rollout

### Blue-Green Deployment

```bash
./scripts/deploy.sh \
  --environment production \
  --type blue-green \
  --version v1.2.3
```

**Benefits:**
- ✅ Instant rollback
- ✅ Full testing of new version
- ✅ No mixed versions
- ⚠️ Requires 2x resources

### Canary Deployment

```bash
./scripts/deploy.sh \
  --environment production \
  --type canary \
  --version v1.2.3
```

**Benefits:**
- ✅ Risk mitigation
- ✅ Real user testing
- ✅ Gradual rollout
- ⚠️ Complex monitoring required

## Infrastructure as Code

### Terraform Modules

Reusable infrastructure components:
- **VPC and networking**
- **Kubernetes clusters**
- **Databases and storage**
- **Load balancers**
- **Monitoring infrastructure**

### Multi-Cloud Support

Templates for:
- **AWS** - EKS, RDS, S3, CloudFront
- **Azure** - AKS, SQL Database, Blob Storage
- **GCP** - GKE, Cloud SQL, Cloud Storage

### Environment Management

- **Separate state files** per environment
- **Workspace isolation**
- **Variable management**
- **Cost optimization**

## Security

### Container Security

- **Image scanning** with Trivy, Snyk
- **Runtime security** with Falco
- **Network policies** for micro-segmentation
- **Secret management** with Vault, Sealed Secrets

### Compliance

- **CIS benchmarks** implementation
- **SOC 2** compliance templates
- **GDPR** data protection measures
- **Audit logging** and reporting

### Access Control

- **RBAC** for Kubernetes
- **IAM** roles and policies
- **MFA** enforcement
- **Service accounts** with least privilege

## Best Practices

### Development Workflow

1. **Feature branches** with PR reviews
2. **Automated testing** on every commit
3. **Security scanning** before merge
4. **Staging deployment** for validation
5. **Production deployment** with approval

### Monitoring Strategy

1. **Golden signals** monitoring (latency, traffic, errors, saturation)
2. **SLI/SLO** definition and tracking
3. **Incident response** procedures
4. **Post-mortem** culture for continuous improvement

### Security Measures

1. **Shift-left security** in CI/CD pipeline
2. **Regular vulnerability assessments**
3. **Secrets rotation** automation
4. **Network segmentation** and zero-trust principles

## Quick Setup Commands

### Local Development

```bash
# Clone and setup
git clone <your-repo>
cd devops

# Start development environment
docker-compose -f docker/docker-compose.dev.yml up -d

# Check services
docker-compose ps
```

### Staging Deployment

```bash
# Deploy to staging
./scripts/deploy.sh \
  --environment staging \
  --version $(git describe --tags)

# Monitor deployment
kubectl get pods -n staging -w
```

### Production Deployment

```bash
# Deploy to production (with approvals)
./scripts/deploy.sh \
  --environment production \
  --type blue-green \
  --version v1.2.3

# Verify deployment
curl -f https://yourdomain.com/health
```

## Configuration Files

### Environment Variables

```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
LOG_LEVEL=debug
```

### Deployment Configuration

```bash
# deploy.config
APP_NAME=myapp
DOCKER_REGISTRY=your-registry.com
HEALTH_CHECK_TIMEOUT=300
BACKUP_BEFORE_DEPLOY=true
SEND_NOTIFICATIONS=true
```

## Monitoring Dashboards

### Application Metrics
- Request rate and latency
- Error rates and types
- Resource utilization
- Custom business metrics

### Infrastructure Metrics
- Server health and performance
- Network traffic and latency
- Storage usage and IOPS
- Container resource usage

### Business Metrics
- User activity and engagement
- Revenue and conversion rates
- Feature usage statistics
- A/B testing results

## Troubleshooting

### Common Issues

**Deployment Failures**
```bash
# Check deployment status
kubectl rollout status deployment/app -n production

# View logs
kubectl logs deployment/app -n production --tail=100

# Rollback if needed
kubectl rollout undo deployment/app -n production
```

**Performance Issues**
```bash
# Check resource usage
kubectl top pods -n production

# Scale up if needed
kubectl scale deployment app --replicas=5 -n production
```

**Service Connectivity**
```bash
# Test service endpoints
kubectl exec -it pod-name -- curl service-name:port/health

# Check network policies
kubectl describe networkpolicy -n production
```

## Support and Contributing

### Getting Help
- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](issues/)
- 💬 [Community Discord](discord-link)
- 📧 [Support Email](mailto:devops@yourcompany.com)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request
5. Follow the code review process

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built for Production** 🚀 **Security First** 🔒 **DevOps Excellence** ⚡