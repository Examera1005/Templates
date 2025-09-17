#!/bin/bash

# Comprehensive Deployment Script
# Handles application deployment with zero-downtime, rollback capabilities, and monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONFIG_FILE="${PROJECT_ROOT}/deploy.config"

# Default values
ENVIRONMENT="staging"
DEPLOYMENT_TYPE="rolling"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ON_FAILURE=true
BACKUP_BEFORE_DEPLOY=true
SEND_NOTIFICATIONS=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log_info "Loading configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log_warning "Configuration file not found. Using defaults."
    fi
}

# Display usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy application with zero-downtime and monitoring.

OPTIONS:
    -e, --environment ENV       Target environment (staging, production)
    -t, --type TYPE            Deployment type (rolling, blue-green, canary)
    -v, --version VERSION      Application version to deploy
    -c, --config FILE          Configuration file path
    -n, --no-backup           Skip database backup
    -r, --no-rollback         Disable automatic rollback on failure
    -s, --no-notifications    Skip sending notifications
    -d, --dry-run             Show what would be deployed without executing
    -h, --help                Show this help message

EXAMPLES:
    $0 -e production -t blue-green -v v1.2.3
    $0 --environment staging --dry-run
    $0 -e production --no-backup --no-notifications

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
            -t|--type)
                DEPLOYMENT_TYPE="$2"
                shift 2
                ;;
            -v|--version)
                APP_VERSION="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -n|--no-backup)
                BACKUP_BEFORE_DEPLOY=false
                shift
                ;;
            -r|--no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            -s|--no-notifications)
                SEND_NOTIFICATIONS=false
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Validate environment and prerequisites
validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"
    
    # Check required tools
    local required_tools=("docker" "kubectl" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    # Validate environment-specific requirements
    case $ENVIRONMENT in
        staging)
            NAMESPACE="staging"
            DOMAIN="staging.yourdomain.com"
            ;;
        production)
            NAMESPACE="production"
            DOMAIN="yourdomain.com"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    # Check Kubernetes connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Verify namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_error "Namespace '$NAMESPACE' does not exist"
        exit 1
    fi
    
    log_success "Environment validation completed"
}

# Backup database before deployment
backup_database() {
    if [[ "$BACKUP_BEFORE_DEPLOY" == "false" ]]; then
        log_info "Skipping database backup"
        return
    fi
    
    log_info "Creating database backup"
    
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_job="backup-job-${backup_name}"
    
    kubectl create job "$backup_job" \
        --from=cronjob/database-backup \
        --namespace="$NAMESPACE" || {
        log_error "Failed to create backup job"
        exit 1
    }
    
    # Wait for backup completion
    local timeout=600
    local elapsed=0
    while [[ $elapsed -lt $timeout ]]; do
        local status=$(kubectl get job "$backup_job" -n "$NAMESPACE" -o jsonpath='{.status.conditions[0].type}' 2>/dev/null || echo "")
        
        if [[ "$status" == "Complete" ]]; then
            log_success "Database backup completed: $backup_name"
            break
        elif [[ "$status" == "Failed" ]]; then
            log_error "Database backup failed"
            exit 1
        fi
        
        sleep 10
        ((elapsed += 10))
    done
    
    if [[ $elapsed -ge $timeout ]]; then
        log_error "Database backup timed out"
        exit 1
    fi
}

# Build and push Docker image
build_and_push_image() {
    local image_tag="${DOCKER_REGISTRY}/${APP_NAME}:${APP_VERSION}"
    
    log_info "Building Docker image: $image_tag"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would build and push image: $image_tag"
        return
    fi
    
    # Build image
    docker build \
        --build-arg BUILD_VERSION="$APP_VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        -t "$image_tag" \
        "$PROJECT_ROOT" || {
        log_error "Failed to build Docker image"
        exit 1
    }
    
    # Security scan
    if command -v trivy &> /dev/null; then
        log_info "Running security scan on image"
        trivy image --exit-code 1 --severity HIGH,CRITICAL "$image_tag" || {
            log_error "Security scan failed"
            exit 1
        }
    fi
    
    # Push image
    docker push "$image_tag" || {
        log_error "Failed to push Docker image"
        exit 1
    }
    
    log_success "Image built and pushed: $image_tag"
}

# Rolling deployment
deploy_rolling() {
    log_info "Starting rolling deployment"
    
    local deployment_name="${APP_NAME}-deployment"
    local image_tag="${DOCKER_REGISTRY}/${APP_NAME}:${APP_VERSION}"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would update deployment $deployment_name to image $image_tag"
        return
    fi
    
    # Update deployment
    kubectl set image deployment/"$deployment_name" \
        "$APP_NAME=$image_tag" \
        --namespace="$NAMESPACE" || {
        log_error "Failed to update deployment"
        exit 1
    }
    
    # Wait for rollout
    kubectl rollout status deployment/"$deployment_name" \
        --namespace="$NAMESPACE" \
        --timeout="${HEALTH_CHECK_TIMEOUT}s" || {
        log_error "Deployment rollout failed"
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback_deployment
        fi
        exit 1
    }
    
    log_success "Rolling deployment completed"
}

# Blue-Green deployment
deploy_blue_green() {
    log_info "Starting blue-green deployment"
    
    local current_color=$(kubectl get service "${APP_NAME}-service" \
        -n "$NAMESPACE" \
        -o jsonpath='{.spec.selector.color}' 2>/dev/null || echo "blue")
    
    local new_color
    if [[ "$current_color" == "blue" ]]; then
        new_color="green"
    else
        new_color="blue"
    fi
    
    log_info "Current color: $current_color, New color: $new_color"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would deploy to $new_color environment"
        return
    fi
    
    # Deploy to new color
    local new_deployment="${APP_NAME}-${new_color}"
    local image_tag="${DOCKER_REGISTRY}/${APP_NAME}:${APP_VERSION}"
    
    # Create new deployment
    kubectl patch deployment "$new_deployment" \
        -n "$NAMESPACE" \
        -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$APP_NAME\",\"image\":\"$image_tag\"}]}}}}" || {
        log_error "Failed to update $new_color deployment"
        exit 1
    }
    
    # Wait for new deployment
    kubectl rollout status deployment/"$new_deployment" \
        --namespace="$NAMESPACE" \
        --timeout="${HEALTH_CHECK_TIMEOUT}s" || {
        log_error "New deployment failed"
        exit 1
    }
    
    # Health check new deployment
    if health_check_deployment "$new_deployment"; then
        # Switch traffic
        kubectl patch service "${APP_NAME}-service" \
            -n "$NAMESPACE" \
            -p "{\"spec\":{\"selector\":{\"color\":\"$new_color\"}}}" || {
            log_error "Failed to switch traffic"
            exit 1
        }
        
        log_success "Traffic switched to $new_color"
        
        # Scale down old deployment
        kubectl scale deployment "${APP_NAME}-${current_color}" \
            --replicas=0 \
            --namespace="$NAMESPACE"
        
        log_success "Blue-green deployment completed"
    else
        log_error "Health check failed for new deployment"
        exit 1
    fi
}

# Canary deployment
deploy_canary() {
    log_info "Starting canary deployment"
    
    local canary_deployment="${APP_NAME}-canary"
    local main_deployment="${APP_NAME}-deployment"
    local image_tag="${DOCKER_REGISTRY}/${APP_NAME}:${APP_VERSION}"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "[DRY RUN] Would deploy canary version"
        return
    fi
    
    # Deploy canary
    kubectl patch deployment "$canary_deployment" \
        -n "$NAMESPACE" \
        -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$APP_NAME\",\"image\":\"$image_tag\"}]}}}}" || {
        log_error "Failed to update canary deployment"
        exit 1
    }
    
    # Scale canary to 10% of main deployment
    local main_replicas=$(kubectl get deployment "$main_deployment" \
        -n "$NAMESPACE" \
        -o jsonpath='{.spec.replicas}')
    local canary_replicas=$(( (main_replicas + 9) / 10 ))  # Round up
    
    kubectl scale deployment "$canary_deployment" \
        --replicas="$canary_replicas" \
        --namespace="$NAMESPACE"
    
    # Wait for canary deployment
    kubectl rollout status deployment/"$canary_deployment" \
        --namespace="$NAMESPACE" \
        --timeout="${HEALTH_CHECK_TIMEOUT}s" || {
        log_error "Canary deployment failed"
        exit 1
    }
    
    # Monitor canary for 5 minutes
    log_info "Monitoring canary deployment for 5 minutes"
    sleep 300
    
    # Check canary health and metrics
    if health_check_deployment "$canary_deployment" && check_canary_metrics; then
        log_info "Canary validation successful. Proceeding with full deployment."
        
        # Update main deployment
        kubectl patch deployment "$main_deployment" \
            -n "$NAMESPACE" \
            -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$APP_NAME\",\"image\":\"$image_tag\"}]}}}}"
        
        kubectl rollout status deployment/"$main_deployment" \
            --namespace="$NAMESPACE" \
            --timeout="${HEALTH_CHECK_TIMEOUT}s"
        
        # Scale down canary
        kubectl scale deployment "$canary_deployment" \
            --replicas=0 \
            --namespace="$NAMESPACE"
        
        log_success "Canary deployment completed"
    else
        log_error "Canary validation failed. Rolling back."
        kubectl scale deployment "$canary_deployment" \
            --replicas=0 \
            --namespace="$NAMESPACE"
        exit 1
    fi
}

# Health check for deployment
health_check_deployment() {
    local deployment_name="$1"
    local max_attempts=30
    local attempt=0
    
    log_info "Running health check for $deployment_name"
    
    while [[ $attempt -lt $max_attempts ]]; do
        local ready_replicas=$(kubectl get deployment "$deployment_name" \
            -n "$NAMESPACE" \
            -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
        local desired_replicas=$(kubectl get deployment "$deployment_name" \
            -n "$NAMESPACE" \
            -o jsonpath='{.spec.replicas}')
        
        if [[ "$ready_replicas" == "$desired_replicas" ]] && [[ "$ready_replicas" -gt 0 ]]; then
            # Additional HTTP health check
            if curl -f -s "https://${DOMAIN}/health" &> /dev/null; then
                log_success "Health check passed for $deployment_name"
                return 0
            fi
        fi
        
        sleep 10
        ((attempt++))
    done
    
    log_error "Health check failed for $deployment_name"
    return 1
}

# Check canary metrics
check_canary_metrics() {
    log_info "Checking canary metrics"
    
    # Query Prometheus for error rate
    local error_rate=$(curl -s "http://prometheus:9090/api/v1/query" \
        --data-urlencode "query=rate(http_requests_total{job=\"$APP_NAME\",status=~\"5..\"}[5m])" | \
        jq -r '.data.result[0].value[1] // "0"')
    
    # Check if error rate is below threshold (1%)
    if (( $(echo "$error_rate < 0.01" | bc -l) )); then
        log_success "Canary metrics validation passed"
        return 0
    else
        log_error "Canary metrics validation failed. Error rate: $error_rate"
        return 1
    fi
}

# Rollback deployment
rollback_deployment() {
    log_warning "Rolling back deployment"
    
    local deployment_name="${APP_NAME}-deployment"
    
    kubectl rollout undo deployment/"$deployment_name" \
        --namespace="$NAMESPACE" || {
        log_error "Failed to rollback deployment"
        exit 1
    }
    
    kubectl rollout status deployment/"$deployment_name" \
        --namespace="$NAMESPACE" \
        --timeout="${HEALTH_CHECK_TIMEOUT}s" || {
        log_error "Rollback failed"
        exit 1
    }
    
    log_success "Rollback completed"
    send_notification "🔄 Deployment rolled back" "error"
}

# Send notifications
send_notification() {
    if [[ "$SEND_NOTIFICATIONS" == "false" ]]; then
        return
    fi
    
    local message="$1"
    local type="${2:-info}"
    local color
    
    case $type in
        success) color="good" ;;
        error) color="danger" ;;
        warning) color="warning" ;;
        *) color="info" ;;
    esac
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{
                \"text\":\"$message\",
                \"attachments\":[{
                    \"color\":\"$color\",
                    \"fields\":[{
                        \"title\":\"Environment\",
                        \"value\":\"$ENVIRONMENT\",
                        \"short\":true
                    },{
                        \"title\":\"Version\",
                        \"value\":\"$APP_VERSION\",
                        \"short\":true
                    },{
                        \"title\":\"Deployment Type\",
                        \"value\":\"$DEPLOYMENT_TYPE\",
                        \"short\":true
                    }]
                }]
            }" &> /dev/null
    fi
    
    # Email notification (if configured)
    if [[ -n "${EMAIL_RECIPIENTS:-}" ]]; then
        echo "$message" | mail -s "Deployment Notification - $ENVIRONMENT" "$EMAIL_RECIPIENTS"
    fi
}

# Main deployment function
main_deploy() {
    log_info "Starting deployment to $ENVIRONMENT using $DEPLOYMENT_TYPE strategy"
    
    # Pre-deployment backup
    backup_database
    
    # Build and push image
    build_and_push_image
    
    # Deploy based on strategy
    case $DEPLOYMENT_TYPE in
        rolling)
            deploy_rolling
            ;;
        blue-green)
            deploy_blue_green
            ;;
        canary)
            deploy_canary
            ;;
        *)
            log_error "Unknown deployment type: $DEPLOYMENT_TYPE"
            exit 1
            ;;
    esac
    
    # Post-deployment verification
    health_check_deployment "${APP_NAME}-deployment"
    
    # Send success notification
    send_notification "🚀 Deployment successful!" "success"
    
    log_success "Deployment completed successfully!"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary resources"
    # Add cleanup logic here
}

# Trap signals for cleanup
trap cleanup EXIT

# Main execution
main() {
    parse_args "$@"
    load_config
    validate_environment
    
    # Set defaults if not provided
    APP_VERSION="${APP_VERSION:-$(git describe --tags --always)}"
    APP_NAME="${APP_NAME:-myapp}"
    DOCKER_REGISTRY="${DOCKER_REGISTRY:-your-registry.com}"
    
    log_info "Deployment configuration:"
    log_info "  Environment: $ENVIRONMENT"
    log_info "  Deployment Type: $DEPLOYMENT_TYPE"
    log_info "  Application: $APP_NAME"
    log_info "  Version: $APP_VERSION"
    log_info "  Namespace: $NAMESPACE"
    log_info "  Domain: $DOMAIN"
    
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_warning "DRY RUN MODE - No actual deployment will occur"
    fi
    
    main_deploy
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi