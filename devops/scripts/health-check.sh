#!/bin/bash

# Health Check Script
# Comprehensive system and application health monitoring

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${HEALTH_CONFIG_FILE:-$SCRIPT_DIR/../config/health.conf}"
LOG_FILE="/var/log/health-check-$(date +%Y%m%d).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
CHECK_INTERVAL=60
TIMEOUT=30
RETRIES=3
ALERT_THRESHOLD=3
RECOVERY_THRESHOLD=2

# Health check types
SYSTEM_CHECKS=true
APPLICATION_CHECKS=true
DATABASE_CHECKS=true
NETWORK_CHECKS=true
DISK_CHECKS=true
MEMORY_CHECKS=true
SERVICE_CHECKS=true

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
LOAD_THRESHOLD=5.0

# Notification settings
SLACK_ENABLED=false
EMAIL_ENABLED=false
PAGERDUTY_ENABLED=false

# Health status tracking
declare -A health_status
declare -A failure_count
declare -A last_alert_time

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log "INFO" "Loading configuration from: $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "WARNING" "Configuration file not found: $CONFIG_FILE, using defaults"
    fi
}

# Display usage
usage() {
    cat << EOF
Health Check Script

Usage: $0 [OPTIONS]

OPTIONS:
    -c, --config FILE          Configuration file path
    -i, --interval SECONDS     Check interval in seconds [default: 60]
    -t, --timeout SECONDS      Request timeout in seconds [default: 30]
    -o, --once                 Run checks once and exit
    -s, --services SERVICE     Check specific services (comma-separated)
    -v, --verbose              Verbose output
    -q, --quiet                Quiet mode (errors only)
    -h, --help                 Show this help message

EXAMPLES:
    $0 --once --verbose
    $0 --interval 30 --services nginx,mysql
    $0 --config /etc/health.conf

CONFIGURATION:
    The script uses a configuration file to define services,
    endpoints, and thresholds. See health.conf.example
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -i|--interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -o|--once)
                RUN_ONCE=true
                shift
                ;;
            -s|--services)
                SPECIFIC_SERVICES="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -q|--quiet)
                QUIET=true
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

# System health checks
check_cpu_usage() {
    local check_name="cpu_usage"
    log "DEBUG" "Checking CPU usage..."
    
    # Get CPU usage percentage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    
    if [[ $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) -eq 1 ]]; then
        health_status[$check_name]="CRITICAL"
        log "ERROR" "High CPU usage: ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "CPU usage: ${cpu_usage}%"
        return 0
    fi
}

check_memory_usage() {
    local check_name="memory_usage"
    log "DEBUG" "Checking memory usage..."
    
    # Get memory usage percentage
    local memory_info=$(free | grep Mem)
    local total=$(echo "$memory_info" | awk '{print $2}')
    local used=$(echo "$memory_info" | awk '{print $3}')
    local memory_usage=$(echo "scale=2; $used * 100 / $total" | bc)
    
    if [[ $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) -eq 1 ]]; then
        health_status[$check_name]="CRITICAL"
        log "ERROR" "High memory usage: ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "Memory usage: ${memory_usage}%"
        return 0
    fi
}

check_disk_usage() {
    local check_name="disk_usage"
    log "DEBUG" "Checking disk usage..."
    
    local critical_disks=()
    
    # Check all mounted filesystems
    while IFS= read -r line; do
        local filesystem=$(echo "$line" | awk '{print $1}')
        local usage=$(echo "$line" | awk '{print $5}' | sed 's/%//')
        local mount_point=$(echo "$line" | awk '{print $6}')
        
        if [[ $usage -gt $DISK_THRESHOLD ]]; then
            critical_disks+=("$mount_point:${usage}%")
        fi
    done < <(df -h | grep -E '^/dev/' | grep -v '/boot')
    
    if [[ ${#critical_disks[@]} -gt 0 ]]; then
        health_status[$check_name]="CRITICAL"
        log "ERROR" "High disk usage: ${critical_disks[*]}"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "Disk usage within limits"
        return 0
    fi
}

check_load_average() {
    local check_name="load_average"
    log "DEBUG" "Checking system load..."
    
    # Get 5-minute load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk -F, '{print $2}' | tr -d ' ')
    
    if [[ $(echo "$load_avg > $LOAD_THRESHOLD" | bc -l) -eq 1 ]]; then
        health_status[$check_name]="CRITICAL"
        log "ERROR" "High system load: $load_avg (threshold: $LOAD_THRESHOLD)"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "System load: $load_avg"
        return 0
    fi
}

# Service health checks
check_service_status() {
    local service_name=$1
    local check_name="service_$service_name"
    
    log "DEBUG" "Checking service: $service_name"
    
    if systemctl is-active --quiet "$service_name"; then
        health_status[$check_name]="OK"
        log "DEBUG" "Service $service_name is running"
        return 0
    else
        health_status[$check_name]="CRITICAL"
        log "ERROR" "Service $service_name is not running"
        return 1
    fi
}

check_process_running() {
    local process_name=$1
    local check_name="process_$process_name"
    
    log "DEBUG" "Checking process: $process_name"
    
    if pgrep "$process_name" > /dev/null; then
        health_status[$check_name]="OK"
        log "DEBUG" "Process $process_name is running"
        return 0
    else
        health_status[$check_name]="CRITICAL"
        log "ERROR" "Process $process_name is not running"
        return 1
    fi
}

# Network health checks
check_network_connectivity() {
    local check_name="network_connectivity"
    log "DEBUG" "Checking network connectivity..."
    
    local hosts=("8.8.8.8" "1.1.1.1" "google.com")
    local failed_hosts=()
    
    for host in "${hosts[@]}"; do
        if ! ping -c 1 -W "$TIMEOUT" "$host" > /dev/null 2>&1; then
            failed_hosts+=("$host")
        fi
    done
    
    if [[ ${#failed_hosts[@]} -eq ${#hosts[@]} ]]; then
        health_status[$check_name]="CRITICAL"
        log "ERROR" "No network connectivity"
        return 1
    elif [[ ${#failed_hosts[@]} -gt 0 ]]; then
        health_status[$check_name]="WARNING"
        log "WARNING" "Partial network connectivity issues: ${failed_hosts[*]}"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "Network connectivity OK"
        return 0
    fi
}

check_dns_resolution() {
    local check_name="dns_resolution"
    log "DEBUG" "Checking DNS resolution..."
    
    local test_domains=("google.com" "github.com" "stackoverflow.com")
    local failed_domains=()
    
    for domain in "${test_domains[@]}"; do
        if ! nslookup "$domain" > /dev/null 2>&1; then
            failed_domains+=("$domain")
        fi
    done
    
    if [[ ${#failed_domains[@]} -gt 0 ]]; then
        health_status[$check_name]="WARNING"
        log "WARNING" "DNS resolution issues: ${failed_domains[*]}"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "DNS resolution OK"
        return 0
    fi
}

# Application health checks
check_http_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local check_name="http_$(echo "$url" | sed 's|[^a-zA-Z0-9]|_|g')"
    
    log "DEBUG" "Checking HTTP endpoint: $url"
    
    local response=$(curl -s -w "%{http_code}" -o /dev/null --connect-timeout "$TIMEOUT" "$url")
    
    if [[ "$response" == "$expected_status" ]]; then
        health_status[$check_name]="OK"
        log "DEBUG" "HTTP endpoint $url returned $response"
        return 0
    else
        health_status[$check_name]="CRITICAL"
        log "ERROR" "HTTP endpoint $url returned $response (expected $expected_status)"
        return 1
    fi
}

check_ssl_certificate() {
    local domain=$1
    local check_name="ssl_$domain"
    
    log "DEBUG" "Checking SSL certificate: $domain"
    
    local expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
        openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    
    if [[ -n "$expiry_date" ]]; then
        local expiry_epoch=$(date -d "$expiry_date" +%s)
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [[ $days_until_expiry -lt 30 ]]; then
            health_status[$check_name]="WARNING"
            log "WARNING" "SSL certificate for $domain expires in $days_until_expiry days"
            return 1
        else
            health_status[$check_name]="OK"
            log "DEBUG" "SSL certificate for $domain expires in $days_until_expiry days"
            return 0
        fi
    else
        health_status[$check_name]="CRITICAL"
        log "ERROR" "Could not retrieve SSL certificate for $domain"
        return 1
    fi
}

# Database health checks
check_mysql_connection() {
    local check_name="mysql_connection"
    log "DEBUG" "Checking MySQL connection..."
    
    if mysql \
        --host="${MYSQL_HOST:-localhost}" \
        --port="${MYSQL_PORT:-3306}" \
        --user="${MYSQL_USER}" \
        --password="${MYSQL_PASSWORD}" \
        --execute="SELECT 1;" > /dev/null 2>&1; then
        health_status[$check_name]="OK"
        log "DEBUG" "MySQL connection OK"
        return 0
    else
        health_status[$check_name]="CRITICAL"
        log "ERROR" "MySQL connection failed"
        return 1
    fi
}

check_postgresql_connection() {
    local check_name="postgresql_connection"
    log "DEBUG" "Checking PostgreSQL connection..."
    
    export PGHOST="${POSTGRES_HOST:-localhost}"
    export PGPORT="${POSTGRES_PORT:-5432}"
    export PGUSER="${POSTGRES_USER}"
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    if psql -d "${POSTGRES_DB:-postgres}" -c "SELECT 1;" > /dev/null 2>&1; then
        health_status[$check_name]="OK"
        log "DEBUG" "PostgreSQL connection OK"
        return 0
    else
        health_status[$check_name]="CRITICAL"
        log "ERROR" "PostgreSQL connection failed"
        return 1
    fi
}

check_redis_connection() {
    local check_name="redis_connection"
    log "DEBUG" "Checking Redis connection..."
    
    local redis_host="${REDIS_HOST:-localhost}"
    local redis_port="${REDIS_PORT:-6379}"
    
    if redis-cli -h "$redis_host" -p "$redis_port" ping | grep -q "PONG"; then
        health_status[$check_name]="OK"
        log "DEBUG" "Redis connection OK"
        return 0
    else
        health_status[$check_name]="CRITICAL"
        log "ERROR" "Redis connection failed"
        return 1
    fi
}

# Container health checks
check_docker_containers() {
    local check_name="docker_containers"
    log "DEBUG" "Checking Docker containers..."
    
    if ! command -v docker &> /dev/null; then
        log "WARNING" "Docker not installed, skipping container checks"
        return 0
    fi
    
    local unhealthy_containers=$(docker ps --filter "health=unhealthy" --format "{{.Names}}")
    local exited_containers=$(docker ps --filter "status=exited" --format "{{.Names}}")
    
    if [[ -n "$unhealthy_containers" || -n "$exited_containers" ]]; then
        health_status[$check_name]="CRITICAL"
        log "ERROR" "Unhealthy containers: $unhealthy_containers, Exited containers: $exited_containers"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "All Docker containers healthy"
        return 0
    fi
}

check_kubernetes_pods() {
    local check_name="kubernetes_pods"
    log "DEBUG" "Checking Kubernetes pods..."
    
    if ! command -v kubectl &> /dev/null; then
        log "WARNING" "kubectl not installed, skipping Kubernetes checks"
        return 0
    fi
    
    local failed_pods=$(kubectl get pods --all-namespaces --field-selector=status.phase!=Running,status.phase!=Succeeded --no-headers 2>/dev/null | wc -l)
    
    if [[ $failed_pods -gt 0 ]]; then
        health_status[$check_name]="CRITICAL"
        log "ERROR" "$failed_pods Kubernetes pods are not running"
        return 1
    else
        health_status[$check_name]="OK"
        log "DEBUG" "All Kubernetes pods healthy"
        return 0
    fi
}

# Notification functions
send_alert() {
    local check_name=$1
    local status=$2
    local message=$3
    
    # Rate limiting - don't send alerts too frequently
    local current_time=$(date +%s)
    local last_alert=${last_alert_time[$check_name]:-0}
    local time_diff=$((current_time - last_alert))
    
    if [[ $time_diff -lt 300 ]]; then  # 5 minutes
        log "DEBUG" "Skipping alert for $check_name (rate limited)"
        return 0
    fi
    
    last_alert_time[$check_name]=$current_time
    
    # Slack notification
    if [[ "$SLACK_ENABLED" == true && -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="danger"
        [[ "$status" == "WARNING" ]] && color="warning"
        [[ "$status" == "OK" ]] && color="good"
        
        local payload=$(jq -n \
            --arg text "Health Check Alert: $check_name" \
            --arg status "$status" \
            --arg message "$message" \
            --arg color "$color" \
            '{
                text: $text,
                attachments: [{
                    color: $color,
                    fields: [
                        {title: "Check", value: $check_name, short: true},
                        {title: "Status", value: $status, short: true},
                        {title: "Message", value: $message, short: false}
                    ]
                }]
            }')
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    # Email notification
    if [[ "$EMAIL_ENABLED" == true && -n "${ALERT_EMAIL:-}" ]]; then
        echo -e "Health Check Alert\n\nCheck: $check_name\nStatus: $status\nMessage: $message\nTime: $(date)" | \
            mail -s "Health Check Alert: $check_name [$status]" "$ALERT_EMAIL" || true
    fi
    
    # PagerDuty notification
    if [[ "$PAGERDUTY_ENABLED" == true && -n "${PAGERDUTY_INTEGRATION_KEY:-}" ]]; then
        local event_action="trigger"
        [[ "$status" == "OK" ]] && event_action="resolve"
        
        local payload=$(jq -n \
            --arg routing_key "$PAGERDUTY_INTEGRATION_KEY" \
            --arg event_action "$event_action" \
            --arg dedup_key "$check_name" \
            --arg summary "$message" \
            --arg severity "critical" \
            '{
                routing_key: $routing_key,
                event_action: $event_action,
                dedup_key: $dedup_key,
                payload: {
                    summary: $summary,
                    severity: $severity,
                    source: "health-check-script"
                }
            }')
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "https://events.pagerduty.com/v2/enqueue" &> /dev/null || true
    fi
}

# Check failure tracking
track_failure() {
    local check_name=$1
    local status=$2
    
    if [[ "$status" != "OK" ]]; then
        failure_count[$check_name]=$((${failure_count[$check_name]:-0} + 1))
        
        # Send alert if failure threshold reached
        if [[ ${failure_count[$check_name]} -ge $ALERT_THRESHOLD ]]; then
            send_alert "$check_name" "$status" "Health check failed ${failure_count[$check_name]} times"
        fi
    else
        # Reset failure count on recovery
        if [[ ${failure_count[$check_name]:-0} -ge $RECOVERY_THRESHOLD ]]; then
            send_alert "$check_name" "OK" "Health check recovered"
        fi
        failure_count[$check_name]=0
    fi
}

# Run all health checks
run_health_checks() {
    log "INFO" "Running health checks..."
    
    local failed_checks=0
    local total_checks=0
    
    # System checks
    if [[ "$SYSTEM_CHECKS" == true ]]; then
        for check in check_cpu_usage check_memory_usage check_disk_usage check_load_average; do
            total_checks=$((total_checks + 1))
            if ! $check; then
                failed_checks=$((failed_checks + 1))
            fi
        done
    fi
    
    # Service checks
    if [[ "$SERVICE_CHECKS" == true ]]; then
        for service in ${SERVICES_TO_CHECK:-nginx mysql postgresql redis docker}; do
            total_checks=$((total_checks + 1))
            if ! check_service_status "$service"; then
                failed_checks=$((failed_checks + 1))
            fi
        done
    fi
    
    # Network checks
    if [[ "$NETWORK_CHECKS" == true ]]; then
        for check in check_network_connectivity check_dns_resolution; do
            total_checks=$((total_checks + 1))
            if ! $check; then
                failed_checks=$((failed_checks + 1))
            fi
        done
    fi
    
    # Application checks
    if [[ "$APPLICATION_CHECKS" == true ]]; then
        for endpoint in ${HTTP_ENDPOINTS:-}; do
            total_checks=$((total_checks + 1))
            if ! check_http_endpoint "$endpoint"; then
                failed_checks=$((failed_checks + 1))
            fi
        done
        
        for domain in ${SSL_DOMAINS:-}; do
            total_checks=$((total_checks + 1))
            if ! check_ssl_certificate "$domain"; then
                failed_checks=$((failed_checks + 1))
            fi
        done
    fi
    
    # Database checks
    if [[ "$DATABASE_CHECKS" == true ]]; then
        [[ -n "${MYSQL_USER:-}" ]] && { total_checks=$((total_checks + 1)); check_mysql_connection || failed_checks=$((failed_checks + 1)); }
        [[ -n "${POSTGRES_USER:-}" ]] && { total_checks=$((total_checks + 1)); check_postgresql_connection || failed_checks=$((failed_checks + 1)); }
        [[ -n "${REDIS_HOST:-}" ]] && { total_checks=$((total_checks + 1)); check_redis_connection || failed_checks=$((failed_checks + 1)); }
    fi
    
    # Container checks
    for check in check_docker_containers check_kubernetes_pods; do
        total_checks=$((total_checks + 1))
        if ! $check; then
            failed_checks=$((failed_checks + 1))
        fi
    done
    
    # Track failures and send alerts
    for check_name in "${!health_status[@]}"; do
        track_failure "$check_name" "${health_status[$check_name]}"
    done
    
    # Summary
    log "INFO" "Health check completed: $((total_checks - failed_checks))/$total_checks passed"
    
    return $failed_checks
}

# Generate health report
generate_report() {
    local report_file="/tmp/health-report-$(date +%Y%m%d-%H%M%S).json"
    
    # Create JSON report
    jq -n \
        --argjson timestamp "$(date +%s)" \
        --arg date "$(date -Iseconds)" \
        --argjson health_status "$(declare -p health_status | sed 's/declare -A health_status=//' | tr -d '()' | jq -R 'split(" ") | map(split("=")) | map({(.[0]): .[1]}) | add')" \
        --argjson failure_count "$(declare -p failure_count | sed 's/declare -A failure_count=//' | tr -d '()' | jq -R 'split(" ") | map(split("=")) | map({(.[0]): .[1]}) | add')" \
        '{
            timestamp: $timestamp,
            date: $date,
            health_status: $health_status,
            failure_count: $failure_count
        }' > "$report_file"
    
    echo "$report_file"
}

# Main execution loop
main() {
    log "INFO" "Starting health check monitor..."
    
    if [[ "${RUN_ONCE:-false}" == true ]]; then
        run_health_checks
        generate_report
        exit $?
    fi
    
    # Continuous monitoring
    while true; do
        run_health_checks
        
        sleep "$CHECK_INTERVAL"
    done
}

# Cleanup function
cleanup() {
    log "INFO" "Health check monitor stopped"
    exit 0
}

# Setup signal handlers
trap cleanup SIGINT SIGTERM

# Parse arguments and run
load_config
parse_args "$@"
main