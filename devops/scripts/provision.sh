#!/bin/bash

# Infrastructure Provisioning Script
# Automates cloud infrastructure setup using Terraform

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"
LOG_FILE="/tmp/provision-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
CLOUD_PROVIDER="aws"
DESTROY=false
AUTO_APPROVE=false
PLAN_ONLY=false
BACKUP_STATE=true

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Display usage information
usage() {
    cat << EOF
Infrastructure Provisioning Script

Usage: $0 [OPTIONS]

OPTIONS:
    -e, --environment ENV       Environment (dev, staging, prod) [default: dev]
    -c, --cloud PROVIDER        Cloud provider (aws, azure, gcp) [default: aws]
    -d, --destroy              Destroy infrastructure instead of creating
    -a, --auto-approve         Auto-approve Terraform changes
    -p, --plan-only            Only show Terraform plan, don't apply
    -s, --skip-backup          Skip state backup
    -h, --help                 Show this help message

EXAMPLES:
    $0 --environment prod --cloud aws
    $0 --environment staging --destroy
    $0 --plan-only --environment dev

ENVIRONMENT VARIABLES:
    TF_VAR_*                   Terraform variables
    AWS_PROFILE                AWS profile to use
    AZURE_SUBSCRIPTION_ID      Azure subscription ID
    GOOGLE_PROJECT             Google Cloud project ID
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -c|--cloud)
                CLOUD_PROVIDER="$2"
                shift 2
                ;;
            -d|--destroy)
                DESTROY=true
                shift
                ;;
            -a|--auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            -p|--plan-only)
                PLAN_ONLY=true
                shift
                ;;
            -s|--skip-backup)
                BACKUP_STATE=false
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                usage
                exit 1
                ;;
        esac
    done
}

# Validate prerequisites
validate_prerequisites() {
    log "INFO" "Validating prerequisites..."
    
    # Check required tools
    local required_tools=("terraform" "jq" "curl")
    
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        required_tools+=("aws")
    elif [[ "$CLOUD_PROVIDER" == "azure" ]]; then
        required_tools+=("az")
    elif [[ "$CLOUD_PROVIDER" == "gcp" ]]; then
        required_tools+=("gcloud")
    fi
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        log "ERROR" "Environment must be one of: dev, staging, prod"
        exit 1
    fi
    
    # Validate cloud provider
    if [[ ! "$CLOUD_PROVIDER" =~ ^(aws|azure|gcp)$ ]]; then
        log "ERROR" "Cloud provider must be one of: aws, azure, gcp"
        exit 1
    fi
    
    # Check Terraform directory
    local tf_dir="$TERRAFORM_DIR/$CLOUD_PROVIDER"
    if [[ ! -d "$tf_dir" ]]; then
        log "ERROR" "Terraform directory not found: $tf_dir"
        exit 1
    fi
    
    log "INFO" "Prerequisites validated successfully"
}

# Setup cloud credentials
setup_credentials() {
    log "INFO" "Setting up cloud credentials for $CLOUD_PROVIDER..."
    
    case "$CLOUD_PROVIDER" in
        aws)
            if [[ -z "${AWS_PROFILE:-}" && -z "${AWS_ACCESS_KEY_ID:-}" ]]; then
                log "ERROR" "AWS credentials not configured. Set AWS_PROFILE or AWS_ACCESS_KEY_ID"
                exit 1
            fi
            
            # Verify AWS credentials
            if ! aws sts get-caller-identity &> /dev/null; then
                log "ERROR" "AWS credentials are invalid or expired"
                exit 1
            fi
            
            log "INFO" "AWS credentials validated"
            ;;
        azure)
            if [[ -z "${AZURE_SUBSCRIPTION_ID:-}" ]]; then
                log "ERROR" "AZURE_SUBSCRIPTION_ID environment variable required"
                exit 1
            fi
            
            # Check Azure login status
            if ! az account show &> /dev/null; then
                log "INFO" "Azure login required"
                az login
            fi
            
            # Set subscription
            az account set --subscription "$AZURE_SUBSCRIPTION_ID"
            log "INFO" "Azure credentials configured for subscription: $AZURE_SUBSCRIPTION_ID"
            ;;
        gcp)
            if [[ -z "${GOOGLE_PROJECT:-}" ]]; then
                log "ERROR" "GOOGLE_PROJECT environment variable required"
                exit 1
            fi
            
            # Check gcloud authentication
            if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 &> /dev/null; then
                log "INFO" "Google Cloud authentication required"
                gcloud auth login
            fi
            
            # Set project
            gcloud config set project "$GOOGLE_PROJECT"
            log "INFO" "Google Cloud credentials configured for project: $GOOGLE_PROJECT"
            ;;
    esac
}

# Backup Terraform state
backup_state() {
    if [[ "$BACKUP_STATE" != true ]]; then
        return 0
    fi
    
    log "INFO" "Backing up Terraform state..."
    
    local tf_dir="$TERRAFORM_DIR/$CLOUD_PROVIDER"
    local state_file="$tf_dir/terraform.tfstate"
    local backup_dir="$tf_dir/backups"
    local backup_file="$backup_dir/terraform.tfstate.backup.$(date +%Y%m%d-%H%M%S)"
    
    if [[ -f "$state_file" ]]; then
        mkdir -p "$backup_dir"
        cp "$state_file" "$backup_file"
        log "INFO" "State backed up to: $backup_file"
    else
        log "INFO" "No existing state file to backup"
    fi
}

# Initialize Terraform
terraform_init() {
    log "INFO" "Initializing Terraform..."
    
    local tf_dir="$TERRAFORM_DIR/$CLOUD_PROVIDER"
    cd "$tf_dir"
    
    # Initialize with backend configuration
    terraform init \
        -backend-config="key=$ENVIRONMENT/terraform.tfstate" \
        -upgrade
    
    # Select or create workspace
    if terraform workspace list | grep -q "$ENVIRONMENT"; then
        terraform workspace select "$ENVIRONMENT"
    else
        terraform workspace new "$ENVIRONMENT"
    fi
    
    log "INFO" "Terraform initialized for environment: $ENVIRONMENT"
}

# Plan Terraform changes
terraform_plan() {
    log "INFO" "Planning Terraform changes..."
    
    local tf_dir="$TERRAFORM_DIR/$CLOUD_PROVIDER"
    cd "$tf_dir"
    
    local plan_file="terraform-$ENVIRONMENT.tfplan"
    local var_file="environments/$ENVIRONMENT.tfvars"
    
    # Check if environment variables file exists
    if [[ ! -f "$var_file" ]]; then
        log "WARNING" "Environment variables file not found: $var_file"
        var_file=""
    fi
    
    local terraform_cmd="terraform plan"
    terraform_cmd="$terraform_cmd -out=$plan_file"
    
    if [[ -n "$var_file" ]]; then
        terraform_cmd="$terraform_cmd -var-file=$var_file"
    fi
    
    if [[ "$DESTROY" == true ]]; then
        terraform_cmd="$terraform_cmd -destroy"
    fi
    
    # Execute plan
    if eval "$terraform_cmd"; then
        log "INFO" "Terraform plan completed successfully"
        
        # Show plan summary
        terraform show -no-color "$plan_file" | head -50
        
        return 0
    else
        log "ERROR" "Terraform plan failed"
        return 1
    fi
}

# Apply Terraform changes
terraform_apply() {
    if [[ "$PLAN_ONLY" == true ]]; then
        log "INFO" "Plan-only mode, skipping apply"
        return 0
    fi
    
    log "INFO" "Applying Terraform changes..."
    
    local tf_dir="$TERRAFORM_DIR/$CLOUD_PROVIDER"
    cd "$tf_dir"
    
    local plan_file="terraform-$ENVIRONMENT.tfplan"
    local terraform_cmd="terraform apply"
    
    if [[ "$AUTO_APPROVE" == true ]]; then
        terraform_cmd="$terraform_cmd -auto-approve"
    fi
    
    terraform_cmd="$terraform_cmd $plan_file"
    
    # Execute apply
    if eval "$terraform_cmd"; then
        log "INFO" "Terraform apply completed successfully"
        
        # Show outputs
        terraform output -json > "outputs-$ENVIRONMENT.json"
        log "INFO" "Outputs saved to: outputs-$ENVIRONMENT.json"
        
        return 0
    else
        log "ERROR" "Terraform apply failed"
        return 1
    fi
}

# Validate infrastructure
validate_infrastructure() {
    log "INFO" "Validating infrastructure..."
    
    local tf_dir="$TERRAFORM_DIR/$CLOUD_PROVIDER"
    cd "$tf_dir"
    
    # Terraform validate
    if ! terraform validate; then
        log "ERROR" "Terraform validation failed"
        return 1
    fi
    
    # Check outputs
    local outputs_file="outputs-$ENVIRONMENT.json"
    if [[ -f "$outputs_file" ]]; then
        local cluster_endpoint=$(jq -r '.cluster_endpoint.value // empty' "$outputs_file")
        local load_balancer_ip=$(jq -r '.load_balancer_ip.value // empty' "$outputs_file")
        
        if [[ -n "$cluster_endpoint" ]]; then
            log "INFO" "Kubernetes cluster endpoint: $cluster_endpoint"
            
            # Test cluster connectivity
            if command -v kubectl &> /dev/null; then
                if kubectl cluster-info &> /dev/null; then
                    log "INFO" "Kubernetes cluster is accessible"
                else
                    log "WARNING" "Kubernetes cluster is not accessible"
                fi
            fi
        fi
        
        if [[ -n "$load_balancer_ip" ]]; then
            log "INFO" "Load balancer IP: $load_balancer_ip"
            
            # Test load balancer connectivity
            if curl -f -s --connect-timeout 10 "http://$load_balancer_ip/health" &> /dev/null; then
                log "INFO" "Load balancer is responding"
            else
                log "WARNING" "Load balancer is not responding"
            fi
        fi
    fi
    
    log "INFO" "Infrastructure validation completed"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Script failed with exit code: $exit_code"
        
        # Optionally show recent logs
        echo -e "\n${YELLOW}Recent logs:${NC}"
        tail -20 "$LOG_FILE"
    fi
    
    log "INFO" "Cleanup completed"
    exit $exit_code
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Slack notification (if webhook URL is configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local payload=$(jq -n \
            --arg text "Infrastructure $status: $message" \
            --arg environment "$ENVIRONMENT" \
            --arg cloud "$CLOUD_PROVIDER" \
            '{
                text: $text,
                attachments: [{
                    color: ($text | contains("SUCCESS") | if . then "good" else "danger" end),
                    fields: [
                        {title: "Environment", value: $environment, short: true},
                        {title: "Cloud Provider", value: $cloud, short: true}
                    ]
                }]
            }')
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    # Email notification (if configured)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "Infrastructure $status - $ENVIRONMENT" "$NOTIFICATION_EMAIL" || true
    fi
}

# Main execution
main() {
    log "INFO" "Starting infrastructure provisioning..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Cloud Provider: $CLOUD_PROVIDER"
    log "INFO" "Operation: $([ "$DESTROY" == true ] && echo "DESTROY" || echo "PROVISION")"
    
    # Setup trap for cleanup
    trap cleanup EXIT
    
    # Execute steps
    validate_prerequisites
    setup_credentials
    backup_state
    terraform_init
    
    if terraform_plan; then
        terraform_apply
        validate_infrastructure
        
        local operation=$([ "$DESTROY" == true ] && echo "destruction" || echo "provisioning")
        log "INFO" "Infrastructure $operation completed successfully"
        send_notification "SUCCESS" "Infrastructure $operation completed for $ENVIRONMENT environment"
    else
        log "ERROR" "Infrastructure provisioning failed"
        send_notification "FAILED" "Infrastructure provisioning failed for $ENVIRONMENT environment"
        exit 1
    fi
}

# Parse arguments and run main function
parse_args "$@"
main