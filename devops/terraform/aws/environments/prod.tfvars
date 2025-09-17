# Production Environment Configuration
# terraform/aws/environments/prod.tfvars

################################################################################
# General Configuration
################################################################################

environment  = "prod"
project_name = "myapp"
owner        = "Production Team"
aws_region   = "us-west-2"

################################################################################
# Networking Configuration
################################################################################

vpc_cidr        = "10.1.0.0/16"
private_subnets = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
public_subnets  = ["10.1.101.0/24", "10.1.102.0/24", "10.1.103.0/24"]

################################################################################
# EKS Configuration
################################################################################

kubernetes_version = "1.28"

# Production-grade instance types
node_instance_types      = ["m5.large", "m5.xlarge"]
node_group_min_size      = 3
node_group_max_size      = 20
node_group_desired_size  = 6

# EC2 key pair for emergency access
ec2_key_pair_name = "production-key-pair"

################################################################################
# Database Configuration
################################################################################

# Production-grade database instance
db_instance_class        = "db.r6g.large"
db_allocated_storage     = 100
db_max_allocated_storage = 1000

db_name     = "proddb"
db_username = "produser"
# Note: Set db_password via environment variable or terraform.tfvars.local
# CRITICAL: Use a strong password for production!
# db_password = "your-very-secure-production-password"

# Extended backup retention for production
db_backup_retention_period = 30

################################################################################
# SSL and Domain Configuration
################################################################################

# REQUIRED: Your SSL certificate ARN for HTTPS
ssl_certificate_arn = "arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Production domain configuration
domain_name = "yourdomain.com"
subdomain   = ""  # Use root domain or set to "www" or "api"

################################################################################
# Monitoring and Logging
################################################################################

# Extended log retention for production
log_retention_days = 90

################################################################################
# Production Safety and Reliability
################################################################################

# Enable all protection features for production
enable_deletion_protection = true
enable_backup             = true
enable_monitoring         = true

# Use on-demand instances for reliability
use_spot_instances  = false
enable_auto_scaling = true

################################################################################
# Security Configuration
################################################################################

enable_encryption = true

# Restrict access to known IP ranges for production
allowed_cidr_blocks = [
  "10.0.0.0/8",     # Internal networks
  "172.16.0.0/12",  # Internal networks
  "192.168.0.0/16", # Internal networks
  # Add your office/VPN IP ranges here
  # "203.0.113.0/24",  # Example office IP range
]

# Enable WAF for production security
enable_waf = true

################################################################################
# Production-specific Configuration
################################################################################

enable_debug_mode   = false
skip_final_snapshot = false
force_destroy_s3    = false

################################################################################
# Feature Flags - Production Features
################################################################################

enable_redis         = true
enable_elasticsearch = true
enable_cdn          = true
enable_api_gateway  = true

################################################################################
# Multi-Region Configuration
################################################################################

enable_multi_region = true
replica_regions     = ["us-east-1", "eu-west-1"]

################################################################################
# Custom Tags
################################################################################

custom_tags = {
  CostCenter    = "production"
  Team          = "platform"
  Purpose       = "production"
  Criticality   = "high"
  Compliance    = "required"
  BackupPolicy  = "daily"
  DataClass     = "confidential"
  SLA           = "99.9"
}

################################################################################
# Kubernetes Configuration
################################################################################

kubernetes_labels = {
  environment = "production"
  team        = "platform"
  criticality = "high"
}

# Enable all security policies for production
pod_security_policy = true
network_policy      = true

################################################################################
# Notification Configuration
################################################################################

# Production notification endpoints
sns_topic_arn     = "arn:aws:sns:us-west-2:123456789012:production-alerts"
slack_webhook_url = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

################################################################################
# Backup Configuration
################################################################################

backup_schedule       = "cron(0 2 * * ? *)"  # Daily at 2 AM UTC
backup_retention_days = 90

################################################################################
# Performance and Scaling
################################################################################

# Additional production-specific variables can be added here
# For example:
# max_pods_per_node = 110
# cluster_log_retention_in_days = 90
# enable_cluster_autoscaler = true
# enable_vertical_pod_autoscaler = true