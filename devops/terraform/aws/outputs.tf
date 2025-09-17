# Outputs for AWS Infrastructure

################################################################################
# VPC Outputs
################################################################################

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

output "nat_gateway_ids" {
  description = "List of IDs of the NAT Gateways"
  value       = module.vpc.natgw_ids
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc.igw_id
}

################################################################################
# EKS Cluster Outputs
################################################################################

output "cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = module.eks.cluster_arn
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_version" {
  description = "EKS cluster version"
  value       = module.eks.cluster_version
}

output "cluster_platform_version" {
  description = "Platform version for the EKS cluster"
  value       = module.eks.cluster_platform_version
}

output "cluster_status" {
  description = "Status of the EKS cluster"
  value       = module.eks.cluster_status
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "oidc_provider_arn" {
  description = "The ARN of the OIDC Provider if enabled"
  value       = module.eks.oidc_provider_arn
}

################################################################################
# EKS Node Group Outputs
################################################################################

output "eks_managed_node_groups" {
  description = "Map of attribute maps for all EKS managed node groups created"
  value       = module.eks.eks_managed_node_groups
  sensitive   = true
}

output "eks_managed_node_groups_autoscaling_group_names" {
  description = "List of the autoscaling group names created by EKS managed node groups"
  value       = module.eks.eks_managed_node_groups_autoscaling_group_names
}

################################################################################
# Security Group Outputs
################################################################################

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS node group"
  value       = module.eks.node_security_group_id
}

output "application_security_group_id" {
  description = "Security group ID for application load balancer"
  value       = aws_security_group.application_sg.id
}

output "database_security_group_id" {
  description = "Security group ID for database"
  value       = aws_security_group.database_sg.id
}

################################################################################
# Database Outputs
################################################################################

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_instance_name" {
  description = "RDS instance name"
  value       = aws_db_instance.main.db_name
}

output "db_instance_username" {
  description = "RDS instance root username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.main.arn
}

output "db_instance_status" {
  description = "RDS instance status"
  value       = aws_db_instance.main.status
}

output "db_instance_availability_zone" {
  description = "RDS instance availability zone"
  value       = aws_db_instance.main.availability_zone
}

output "db_subnet_group_id" {
  description = "RDS subnet group name"
  value       = aws_db_subnet_group.main.id
}

output "db_parameter_group_id" {
  description = "RDS parameter group name"
  value       = aws_db_parameter_group.main.id
}

################################################################################
# S3 Bucket Outputs
################################################################################

output "app_storage_bucket_id" {
  description = "Application storage S3 bucket ID"
  value       = aws_s3_bucket.app_storage.id
}

output "app_storage_bucket_arn" {
  description = "Application storage S3 bucket ARN"
  value       = aws_s3_bucket.app_storage.arn
}

output "app_storage_bucket_domain_name" {
  description = "Application storage S3 bucket domain name"
  value       = aws_s3_bucket.app_storage.bucket_domain_name
}

output "backup_storage_bucket_id" {
  description = "Backup storage S3 bucket ID"
  value       = aws_s3_bucket.backup_storage.id
}

output "backup_storage_bucket_arn" {
  description = "Backup storage S3 bucket ARN"
  value       = aws_s3_bucket.backup_storage.arn
}

################################################################################
# Load Balancer Outputs
################################################################################

output "load_balancer_id" {
  description = "ID of the load balancer"
  value       = aws_lb.main.id
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

################################################################################
# CloudWatch Outputs
################################################################################

output "application_log_group_name" {
  description = "Application CloudWatch log group name"
  value       = aws_cloudwatch_log_group.application.name
}

output "application_log_group_arn" {
  description = "Application CloudWatch log group ARN"
  value       = aws_cloudwatch_log_group.application.arn
}

output "database_log_group_name" {
  description = "Database CloudWatch log group name"
  value       = aws_cloudwatch_log_group.database.name
}

output "database_log_group_arn" {
  description = "Database CloudWatch log group ARN"
  value       = aws_cloudwatch_log_group.database.arn
}

################################################################################
# Route53 Outputs
################################################################################

output "route53_record_name" {
  description = "Route53 record name"
  value       = var.domain_name != "" ? aws_route53_record.main[0].name : null
}

output "route53_record_fqdn" {
  description = "Route53 record FQDN"
  value       = var.domain_name != "" ? aws_route53_record.main[0].fqdn : null
}

################################################################################
# IAM Outputs
################################################################################

output "ebs_csi_driver_role_arn" {
  description = "ARN of the EBS CSI driver IAM role"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "rds_enhanced_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring IAM role"
  value       = aws_iam_role.rds_enhanced_monitoring.arn
}

################################################################################
# Configuration Outputs
################################################################################

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

################################################################################
# Connection Information
################################################################################

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "database_connection_string" {
  description = "Database connection string (without password)"
  value       = "mysql://${aws_db_instance.main.username}@${aws_db_instance.main.endpoint}:${aws_db_instance.main.port}/${aws_db_instance.main.db_name}"
  sensitive   = true
}

################################################################################
# URLs and Endpoints
################################################################################

output "application_url" {
  description = "Application URL"
  value       = var.domain_name != "" ? "https://${var.subdomain != "" ? "${var.subdomain}." : ""}${var.domain_name}" : "https://${aws_lb.main.dns_name}"
}

output "kubernetes_dashboard_url" {
  description = "Kubernetes dashboard URL (if deployed)"
  value       = "https://${aws_lb.main.dns_name}/dashboard"
}

################################################################################
# Summary Information
################################################################################

output "infrastructure_summary" {
  description = "Summary of deployed infrastructure"
  value = {
    vpc = {
      id   = module.vpc.vpc_id
      cidr = module.vpc.vpc_cidr_block
    }
    eks_cluster = {
      name     = module.eks.cluster_name
      endpoint = module.eks.cluster_endpoint
      version  = module.eks.cluster_version
    }
    database = {
      endpoint = aws_db_instance.main.endpoint
      engine   = aws_db_instance.main.engine
      version  = aws_db_instance.main.engine_version
    }
    load_balancer = {
      dns_name = aws_lb.main.dns_name
      type     = aws_lb.main.load_balancer_type
    }
    storage = {
      app_bucket    = aws_s3_bucket.app_storage.id
      backup_bucket = aws_s3_bucket.backup_storage.id
    }
  }
}

################################################################################
# Health Check Endpoints
################################################################################

output "health_check_endpoints" {
  description = "Health check endpoints for monitoring"
  value = {
    load_balancer   = "https://${aws_lb.main.dns_name}/health"
    database        = "${aws_db_instance.main.endpoint}:${aws_db_instance.main.port}"
    kubernetes_api  = module.eks.cluster_endpoint
  }
}

################################################################################
# Monitoring and Logging
################################################################################

output "monitoring_endpoints" {
  description = "Monitoring and logging endpoints"
  value = {
    cloudwatch_logs = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#logsV2:log-groups"
    eks_logs        = aws_cloudwatch_log_group.application.name
    database_logs   = aws_cloudwatch_log_group.database.name
  }
}