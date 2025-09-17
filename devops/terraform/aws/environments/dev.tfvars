# Development Environment Configuration
# terraform/aws/environments/dev.tfvars

################################################################################
# General Configuration
################################################################################

environment  = "dev"
project_name = "myapp"
owner        = "Development Team"
aws_region   = "us-west-2"

################################################################################
# Networking Configuration
################################################################################

vpc_cidr        = "10.0.0.0/16"
private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

################################################################################
# EKS Configuration
################################################################################

kubernetes_version = "1.28"

# Small instance types for development
node_instance_types      = ["t3.small"]
node_group_min_size      = 1
node_group_max_size      = 3
node_group_desired_size  = 2

# EC2 key pair for SSH access (optional)
ec2_key_pair_name = ""

################################################################################
# Database Configuration
################################################################################

# Small instance for development
db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 50

db_name     = "devdb"
db_username = "devuser"
# Note: Set db_password via environment variable or terraform.tfvars.local
# db_password = "your-secure-password-here"

# Short backup retention for development
db_backup_retention_period = 1

################################################################################
# SSL and Domain Configuration
################################################################################

# Leave empty for development or use your own certificate ARN
ssl_certificate_arn = ""

# Optional: Use your own domain for development
domain_name = ""
subdomain   = "dev"

################################################################################
# Monitoring and Logging
################################################################################

# Short log retention for development
log_retention_days = 7

################################################################################
# Cost Optimization for Development
################################################################################

# Disable expensive features for development
enable_deletion_protection = false
enable_backup             = false
enable_monitoring         = false

# Use spot instances for cost savings
use_spot_instances  = true
enable_auto_scaling = true

################################################################################
# Security Configuration
################################################################################

enable_encryption = true

# Allow all traffic for development (restrict in production)
allowed_cidr_blocks = ["0.0.0.0/0"]

# Disable WAF for development
enable_waf = false

################################################################################
# Development-specific Configuration
################################################################################

enable_debug_mode       = true
skip_final_snapshot     = true
force_destroy_s3        = true

################################################################################
# Feature Flags - Disabled for Development
################################################################################

enable_redis         = false
enable_elasticsearch = false
enable_cdn          = false
enable_api_gateway  = false

################################################################################
# Multi-Region - Disabled for Development
################################################################################

enable_multi_region = false
replica_regions     = []

################################################################################
# Custom Tags
################################################################################

custom_tags = {
  CostCenter  = "development"
  Team        = "engineering"
  Purpose     = "development"
  AutoShutdown = "true"
}

################################################################################
# Kubernetes Configuration
################################################################################

kubernetes_labels = {
  environment = "development"
  team        = "engineering"
}

# Enable security policies
pod_security_policy = true
network_policy      = true

################################################################################
# Notification Configuration
################################################################################

# Optional: Add your notification endpoints
sns_topic_arn      = ""
slack_webhook_url  = ""

################################################################################
# Backup Configuration
################################################################################

backup_schedule       = "cron(0 6 * * ? *)"  # Daily at 6 AM UTC
backup_retention_days = 7