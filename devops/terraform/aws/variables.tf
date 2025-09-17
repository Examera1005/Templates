# Variables for AWS Infrastructure

################################################################################
# General Configuration
################################################################################

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "myapp"
}

variable "owner" {
  description = "Owner of the infrastructure"
  type        = string
  default     = "DevOps Team"
}

################################################################################
# Networking Configuration
################################################################################

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
}

################################################################################
# EKS Configuration
################################################################################

variable "kubernetes_version" {
  description = "Kubernetes version for EKS cluster"
  type        = string
  default     = "1.28"
}

variable "node_instance_types" {
  description = "Instance types for EKS node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in EKS node group"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in EKS node group"
  type        = number
  default     = 10
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in EKS node group"
  type        = number
  default     = 3
}

variable "ec2_key_pair_name" {
  description = "EC2 Key Pair name for node group instances"
  type        = string
  default     = ""
}

################################################################################
# Database Configuration
################################################################################

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage for RDS instance (GB)"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS instance (GB)"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Name of the database"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters long."
  }
}

variable "db_backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
  
  validation {
    condition     = var.db_backup_retention_period >= 0 && var.db_backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days."
  }
}

################################################################################
# SSL Configuration
################################################################################

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for ALB"
  type        = string
  default     = ""
}

################################################################################
# Domain Configuration
################################################################################

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "subdomain" {
  description = "Subdomain for the application"
  type        = string
  default     = ""
}

################################################################################
# Monitoring and Logging
################################################################################

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
  
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

################################################################################
# Environment-specific Configuration
################################################################################

variable "enable_deletion_protection" {
  description = "Enable deletion protection for production resources"
  type        = bool
  default     = false
}

variable "enable_backup" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable enhanced monitoring"
  type        = bool
  default     = true
}

################################################################################
# Cost Optimization
################################################################################

variable "use_spot_instances" {
  description = "Use spot instances for cost optimization"
  type        = bool
  default     = false
}

variable "enable_auto_scaling" {
  description = "Enable auto scaling for cost optimization"
  type        = bool
  default     = true
}

################################################################################
# Security Configuration
################################################################################

variable "enable_encryption" {
  description = "Enable encryption at rest and in transit"
  type        = bool
  default     = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the application"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_waf" {
  description = "Enable AWS WAF for additional security"
  type        = bool
  default     = false
}

################################################################################
# Backup Configuration
################################################################################

variable "backup_schedule" {
  description = "Backup schedule in cron format"
  type        = string
  default     = "cron(0 2 * * ? *)"  # Daily at 2 AM UTC
}

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
}

################################################################################
# Notification Configuration
################################################################################

variable "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

################################################################################
# Feature Flags
################################################################################

variable "enable_redis" {
  description = "Enable Redis ElastiCache cluster"
  type        = bool
  default     = false
}

variable "enable_elasticsearch" {
  description = "Enable Elasticsearch cluster"
  type        = bool
  default     = false
}

variable "enable_cdn" {
  description = "Enable CloudFront CDN"
  type        = bool
  default     = false
}

variable "enable_api_gateway" {
  description = "Enable API Gateway"
  type        = bool
  default     = false
}

################################################################################
# Advanced Configuration
################################################################################

variable "custom_tags" {
  description = "Custom tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "kubernetes_labels" {
  description = "Custom labels for Kubernetes resources"
  type        = map(string)
  default     = {}
}

variable "pod_security_policy" {
  description = "Enable Pod Security Policy"
  type        = bool
  default     = true
}

variable "network_policy" {
  description = "Enable Kubernetes Network Policy"
  type        = bool
  default     = true
}

################################################################################
# Multi-Region Configuration
################################################################################

variable "enable_multi_region" {
  description = "Enable multi-region deployment"
  type        = bool
  default     = false
}

variable "replica_regions" {
  description = "Additional regions for replica deployment"
  type        = list(string)
  default     = []
}

################################################################################
# Development Configuration
################################################################################

variable "enable_debug_mode" {
  description = "Enable debug mode for development"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on database deletion (dev only)"
  type        = bool
  default     = true
}

variable "force_destroy_s3" {
  description = "Force destroy S3 buckets even if not empty (dev only)"
  type        = bool
  default     = false
}