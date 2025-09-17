# AWS Infrastructure as Code
# Complete AWS infrastructure setup with EKS, RDS, S3, and networking

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }
  
  backend "s3" {
    bucket  = "terraform-state-bucket"
    key     = "infrastructure/terraform.tfstate"
    region  = "us-west-2"
    encrypt = true
    
    dynamodb_table = "terraform-state-lock"
  }
}

# Configure AWS Provider
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      Owner       = var.owner
    }
  }
}

# Configure Kubernetes Provider
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

# Configure Helm Provider
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

################################################################################
# VPC and Networking
################################################################################

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "${var.project_name}-${var.environment}-vpc"
  cidr = var.vpc_cidr
  
  azs             = local.azs
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  
  enable_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # Enable flow logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true
  
  # Public subnet tags for Load Balancer
  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }
  
  # Private subnet tags for Load Balancer
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
  
  tags = local.tags
}

################################################################################
# Security Groups
################################################################################

resource "aws_security_group" "application_sg" {
  name_prefix = "${var.project_name}-${var.environment}-app-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name = "${var.project_name}-${var.environment}-application-sg"
  })
}

resource "aws_security_group" "database_sg" {
  name_prefix = "${var.project_name}-${var.environment}-db-"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    description     = "MySQL/Aurora"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.application_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.tags, {
    Name = "${var.project_name}-${var.environment}-database-sg"
  })
}

################################################################################
# EKS Cluster
################################################################################

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "${var.project_name}-${var.environment}-cluster"
  cluster_version = var.kubernetes_version
  
  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true
  
  # Enable cluster logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  # EKS Managed Node Groups
  eks_managed_node_groups = {
    main = {
      name = "${var.project_name}-${var.environment}-nodes"
      
      instance_types = var.node_instance_types
      
      min_size     = var.node_group_min_size
      max_size     = var.node_group_max_size
      desired_size = var.node_group_desired_size
      
      # Launch template configuration
      launch_template_name            = "${var.project_name}-${var.environment}-nodes"
      launch_template_use_name_prefix = true
      launch_template_version         = "$Latest"
      
      vpc_security_group_ids = [aws_security_group.application_sg.id]
      
      # Instance configuration
      ami_type               = "AL2_x86_64"
      capacity_type          = "ON_DEMAND"
      disk_size              = 50
      force_update_version   = false
      
      # Remote access
      remote_access = {
        ec2_ssh_key               = var.ec2_key_pair_name
        source_security_group_ids = [aws_security_group.application_sg.id]
      }
      
      # Labels and taints
      labels = {
        Environment = var.environment
        NodeGroup   = "main"
      }
      
      tags = {
        ExtraTag = "EKS managed node group"
      }
    }
  }
  
  # Cluster access entry
  access_entries = {
    admin = {
      kubernetes_groups = []
      principal_arn     = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      
      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }
  
  tags = local.tags
}

################################################################################
# EKS Add-ons
################################################################################

resource "aws_eks_addon" "coredns" {
  cluster_name             = module.eks.cluster_name
  addon_name               = "coredns"
  addon_version            = "v1.10.1-eksbuild.4"
  resolve_conflicts        = "OVERWRITE"
  
  depends_on = [module.eks.eks_managed_node_groups]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name             = module.eks.cluster_name
  addon_name               = "kube-proxy"
  addon_version            = "v1.28.2-eksbuild.2"
  resolve_conflicts        = "OVERWRITE"
  
  depends_on = [module.eks.eks_managed_node_groups]
}

resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = module.eks.cluster_name
  addon_name               = "vpc-cni"
  addon_version            = "v1.15.4-eksbuild.1"
  resolve_conflicts        = "OVERWRITE"
  
  configuration_values = jsonencode({
    enableNetworkPolicy = "true"
  })
  
  depends_on = [module.eks.eks_managed_node_groups]
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name             = module.eks.cluster_name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.24.1-eksbuild.1"
  resolve_conflicts        = "OVERWRITE"
  service_account_role_arn = aws_iam_role.ebs_csi_driver.arn
  
  depends_on = [module.eks.eks_managed_node_groups]
}

################################################################################
# IAM Roles for EKS Add-ons
################################################################################

resource "aws_iam_role" "ebs_csi_driver" {
  name = "${var.project_name}-${var.environment}-ebs-csi-driver"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Condition = {
          StringEquals = {
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub": "system:serviceaccount:kube-system:ebs-csi-controller-sa"
            "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud": "sts.amazonaws.com"
          }
        }
        Principal = {
          Federated = module.eks.oidc_provider_arn
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/Amazon_EBS_CSI_DriverPolicy"
  role       = aws_iam_role.ebs_csi_driver.name
}

################################################################################
# RDS Database
################################################################################

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = module.vpc.private_subnets
  
  tags = merge(local.tags, {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  })
}

resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "${var.project_name}-${var.environment}-db-params"
  
  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }
  
  tags = local.tags
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.environment}-database"
  
  # Engine configuration
  engine                = "mysql"
  engine_version        = "8.0.35"
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  
  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 3306
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database_sg.id]
  publicly_accessible    = false
  
  # Backup configuration
  backup_retention_period = var.db_backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Monitoring and logging
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_enhanced_monitoring.arn
  
  enabled_cloudwatch_logs_exports = ["error", "general", "slow-query"]
  
  # Security
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name
  
  # Deletion protection
  deletion_protection = var.environment == "prod" ? true : false
  skip_final_snapshot = var.environment == "prod" ? false : true
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  tags = merge(local.tags, {
    Name = "${var.project_name}-${var.environment}-database"
  })
}

resource "aws_db_option_group" "main" {
  name                 = "${var.project_name}-${var.environment}-db-options"
  option_group_description = "Option group for ${var.project_name} ${var.environment}"
  engine_name          = "mysql"
  major_engine_version = "8.0"
  
  tags = local.tags
}

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

################################################################################
# S3 Buckets
################################################################################

resource "aws_s3_bucket" "app_storage" {
  bucket = "${var.project_name}-${var.environment}-app-storage-${random_string.bucket_suffix.result}"
  
  tags = local.tags
}

resource "aws_s3_bucket_versioning" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_public_access_block" "app_storage" {
  bucket = aws_s3_bucket.app_storage.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "backup_storage" {
  bucket = "${var.project_name}-${var.environment}-backup-storage-${random_string.bucket_suffix.result}"
  
  tags = local.tags
}

resource "aws_s3_bucket_versioning" "backup_storage" {
  bucket = aws_s3_bucket.backup_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "backup_storage" {
  bucket = aws_s3_bucket.backup_storage.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backup_storage" {
  bucket = aws_s3_bucket.backup_storage.id
  
  rule {
    id     = "backup_lifecycle"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
    
    expiration {
      days = 2555  # 7 years
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

################################################################################
# Application Load Balancer
################################################################################

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.application_sg.id]
  subnets            = module.vpc.public_subnets
  
  enable_deletion_protection = var.environment == "prod" ? true : false
  
  access_logs {
    bucket  = aws_s3_bucket.app_storage.bucket
    prefix  = "alb-logs"
    enabled = true
  }
  
  tags = local.tags
}

resource "aws_lb_target_group" "main" {
  name     = "${var.project_name}-${var.environment}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = module.vpc.vpc_id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = local.tags
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
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

resource "aws_lb_listener" "main_https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.ssl_certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

################################################################################
# CloudWatch Log Groups
################################################################################

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/eks/${module.eks.cluster_name}/application"
  retention_in_days = var.log_retention_days
  
  tags = local.tags
}

resource "aws_cloudwatch_log_group" "database" {
  name              = "/aws/rds/instance/${aws_db_instance.main.id}/error"
  retention_in_days = var.log_retention_days
  
  tags = local.tags
}

################################################################################
# Route53 (Optional)
################################################################################

data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

resource "aws_route53_record" "main" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.subdomain != "" ? "${var.subdomain}.${var.domain_name}" : var.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}