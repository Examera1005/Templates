#!/bin/bash

# Backup Automation Script
# Automated backup solution for databases, files, and configurations

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${BACKUP_CONFIG_FILE:-$SCRIPT_DIR/../config/backup.conf}"
LOG_FILE="/var/log/backup-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
BACKUP_ROOT="/backup"
RETENTION_DAYS=30
COMPRESSION_LEVEL=6
ENCRYPTION_ENABLED=true
NOTIFICATION_ENABLED=true
CLEANUP_ENABLED=true
VERIFY_BACKUP=true

# Backup types
DATABASE_BACKUP=true
FILE_BACKUP=true
CONFIG_BACKUP=true
CONTAINER_BACKUP=false

# Cloud storage
AWS_S3_ENABLED=false
AZURE_BLOB_ENABLED=false
GCP_STORAGE_ENABLED=false

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
    # Send to syslog
    logger -t "backup-script" "[$level] $message"
}

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        log "INFO" "Loading configuration from: $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "WARNING" "Configuration file not found: $CONFIG_FILE, using defaults"
    fi
    
    # Create backup directories
    mkdir -p "$BACKUP_ROOT"/{database,files,config,containers,temp}
    
    # Set permissions
    chmod 700 "$BACKUP_ROOT"
}

# Display usage
usage() {
    cat << EOF
Backup Automation Script

Usage: $0 [OPTIONS]

OPTIONS:
    -t, --type TYPE            Backup type (database, files, config, containers, all) [default: all]
    -e, --environment ENV      Environment (dev, staging, prod) [default: prod]
    -c, --config FILE          Configuration file path
    -d, --destination DIR      Backup destination directory
    -r, --retention DAYS       Retention period in days [default: 30]
    -n, --no-compression       Disable compression
    -s, --skip-verification    Skip backup verification
    -q, --quiet                Quiet mode (minimal output)
    -h, --help                 Show this help message

EXAMPLES:
    $0 --type database --environment prod
    $0 --type all --retention 7
    $0 --destination /mnt/backup --no-compression

CONFIGURATION FILE:
    The script uses a configuration file for database connections,
    file paths, and cloud storage settings. See backup.conf.example
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--type)
                BACKUP_TYPE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            -d|--destination)
                BACKUP_ROOT="$2"
                shift 2
                ;;
            -r|--retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            -n|--no-compression)
                COMPRESSION_LEVEL=0
                shift
                ;;
            -s|--skip-verification)
                VERIFY_BACKUP=false
                shift
                ;;
            -q|--quiet)
                QUIET_MODE=true
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
    
    # Set backup types based on argument
    case "${BACKUP_TYPE:-all}" in
        database)
            DATABASE_BACKUP=true
            FILE_BACKUP=false
            CONFIG_BACKUP=false
            CONTAINER_BACKUP=false
            ;;
        files)
            DATABASE_BACKUP=false
            FILE_BACKUP=true
            CONFIG_BACKUP=false
            CONTAINER_BACKUP=false
            ;;
        config)
            DATABASE_BACKUP=false
            FILE_BACKUP=false
            CONFIG_BACKUP=true
            CONTAINER_BACKUP=false
            ;;
        containers)
            DATABASE_BACKUP=false
            FILE_BACKUP=false
            CONFIG_BACKUP=false
            CONTAINER_BACKUP=true
            ;;
        all)
            DATABASE_BACKUP=true
            FILE_BACKUP=true
            CONFIG_BACKUP=true
            CONTAINER_BACKUP=true
            ;;
        *)
            log "ERROR" "Invalid backup type: ${BACKUP_TYPE}"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check required tools
    local required_tools=("tar" "gzip" "date" "find")
    
    if [[ "$ENCRYPTION_ENABLED" == true ]]; then
        required_tools+=("gpg")
    fi
    
    if [[ "$DATABASE_BACKUP" == true ]]; then
        required_tools+=("mysqldump" "pg_dump")
    fi
    
    if [[ "$CONTAINER_BACKUP" == true ]]; then
        required_tools+=("docker")
    fi
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "WARNING" "$tool not found, some backup features may not work"
        fi
    done
    
    # Check disk space
    local available_space=$(df "$BACKUP_ROOT" | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log "WARNING" "Low disk space available: ${available_space}KB"
    fi
    
    log "INFO" "Prerequisites check completed"
}

# Database backup functions
backup_mysql() {
    local db_name=$1
    local backup_file="$BACKUP_ROOT/database/mysql_${db_name}_$(date +%Y%m%d_%H%M%S).sql"
    
    log "INFO" "Backing up MySQL database: $db_name"
    
    # Create backup with compression
    if [[ $COMPRESSION_LEVEL -gt 0 ]]; then
        mysqldump \
            --host="${MYSQL_HOST:-localhost}" \
            --port="${MYSQL_PORT:-3306}" \
            --user="${MYSQL_USER}" \
            --password="${MYSQL_PASSWORD}" \
            --single-transaction \
            --routines \
            --triggers \
            "$db_name" | gzip -"$COMPRESSION_LEVEL" > "${backup_file}.gz"
        
        backup_file="${backup_file}.gz"
    else
        mysqldump \
            --host="${MYSQL_HOST:-localhost}" \
            --port="${MYSQL_PORT:-3306}" \
            --user="${MYSQL_USER}" \
            --password="${MYSQL_PASSWORD}" \
            --single-transaction \
            --routines \
            --triggers \
            "$db_name" > "$backup_file"
    fi
    
    # Encrypt if enabled
    if [[ "$ENCRYPTION_ENABLED" == true ]]; then
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "${backup_file}.gpg" "$backup_file"
        rm "$backup_file"
        backup_file="${backup_file}.gpg"
    fi
    
    log "INFO" "MySQL backup completed: $backup_file"
    echo "$backup_file"
}

backup_postgresql() {
    local db_name=$1
    local backup_file="$BACKUP_ROOT/database/postgres_${db_name}_$(date +%Y%m%d_%H%M%S).sql"
    
    log "INFO" "Backing up PostgreSQL database: $db_name"
    
    # Set environment variables for pg_dump
    export PGHOST="${POSTGRES_HOST:-localhost}"
    export PGPORT="${POSTGRES_PORT:-5432}"
    export PGUSER="${POSTGRES_USER}"
    export PGPASSWORD="${POSTGRES_PASSWORD}"
    
    # Create backup with compression
    if [[ $COMPRESSION_LEVEL -gt 0 ]]; then
        pg_dump \
            --format=custom \
            --compress="$COMPRESSION_LEVEL" \
            --verbose \
            "$db_name" > "$backup_file.custom"
        
        backup_file="$backup_file.custom"
    else
        pg_dump \
            --format=plain \
            --verbose \
            "$db_name" > "$backup_file"
    fi
    
    # Encrypt if enabled
    if [[ "$ENCRYPTION_ENABLED" == true ]]; then
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "${backup_file}.gpg" "$backup_file"
        rm "$backup_file"
        backup_file="${backup_file}.gpg"
    fi
    
    log "INFO" "PostgreSQL backup completed: $backup_file"
    echo "$backup_file"
}

backup_mongodb() {
    local db_name=$1
    local backup_dir="$BACKUP_ROOT/database/mongodb_${db_name}_$(date +%Y%m%d_%H%M%S)"
    
    log "INFO" "Backing up MongoDB database: $db_name"
    
    # Create backup directory
    mkdir -p "$backup_dir"
    
    # MongoDB backup
    mongodump \
        --host="${MONGODB_HOST:-localhost}:${MONGODB_PORT:-27017}" \
        --username="${MONGODB_USER}" \
        --password="${MONGODB_PASSWORD}" \
        --db="$db_name" \
        --out="$backup_dir"
    
    # Compress backup
    local archive_file="$backup_dir.tar"
    if [[ $COMPRESSION_LEVEL -gt 0 ]]; then
        tar -czf "${archive_file}.gz" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
        archive_file="${archive_file}.gz"
    else
        tar -cf "$archive_file" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
    fi
    
    # Cleanup temporary directory
    rm -rf "$backup_dir"
    
    # Encrypt if enabled
    if [[ "$ENCRYPTION_ENABLED" == true ]]; then
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "${archive_file}.gpg" "$archive_file"
        rm "$archive_file"
        archive_file="${archive_file}.gpg"
    fi
    
    log "INFO" "MongoDB backup completed: $archive_file"
    echo "$archive_file"
}

# File backup function
backup_files() {
    log "INFO" "Starting file backup..."
    
    local backup_file="$BACKUP_ROOT/files/files_$(date +%Y%m%d_%H%M%S).tar"
    local file_list="$BACKUP_ROOT/temp/file_list.txt"
    
    # Create list of files to backup
    cat > "$file_list" << EOF
/etc
/home
/var/www
/opt
/usr/local/bin
EOF
    
    # Add custom paths from configuration
    if [[ -n "${BACKUP_PATHS:-}" ]]; then
        echo "$BACKUP_PATHS" | tr ',' '\n' >> "$file_list"
    fi
    
    # Create exclusion list
    local exclude_file="$BACKUP_ROOT/temp/exclude_list.txt"
    cat > "$exclude_file" << EOF
*.tmp
*.log
*.cache
/proc
/sys
/dev
/tmp
/var/tmp
/var/cache
/var/log
*.sock
EOF
    
    # Create tar archive
    if [[ $COMPRESSION_LEVEL -gt 0 ]]; then
        tar -czf "${backup_file}.gz" \
            --files-from="$file_list" \
            --exclude-from="$exclude_file" \
            --exclude-caches \
            --one-file-system \
            2>/dev/null || true
        
        backup_file="${backup_file}.gz"
    else
        tar -cf "$backup_file" \
            --files-from="$file_list" \
            --exclude-from="$exclude_file" \
            --exclude-caches \
            --one-file-system \
            2>/dev/null || true
    fi
    
    # Encrypt if enabled
    if [[ "$ENCRYPTION_ENABLED" == true ]]; then
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "${backup_file}.gpg" "$backup_file"
        rm "$backup_file"
        backup_file="${backup_file}.gpg"
    fi
    
    # Cleanup temp files
    rm -f "$file_list" "$exclude_file"
    
    log "INFO" "File backup completed: $backup_file"
    echo "$backup_file"
}

# Configuration backup function
backup_configurations() {
    log "INFO" "Starting configuration backup..."
    
    local backup_file="$BACKUP_ROOT/config/config_$(date +%Y%m%d_%H%M%S).tar"
    local config_paths=(
        "/etc/nginx"
        "/etc/apache2"
        "/etc/ssh"
        "/etc/systemd"
        "/etc/cron.d"
        "/etc/crontab"
        "/etc/hosts"
        "/etc/fstab"
        "/etc/passwd"
        "/etc/shadow"
        "/etc/group"
        "/root/.ssh"
        "/home/*/.ssh"
    )
    
    # Add Kubernetes configurations if available
    if command -v kubectl &> /dev/null; then
        config_paths+=(
            "/etc/kubernetes"
            "/var/lib/etcd"
            "$HOME/.kube"
        )
    fi
    
    # Add Docker configurations if available
    if command -v docker &> /dev/null; then
        config_paths+=(
            "/etc/docker"
            "/var/lib/docker/volumes"
        )
    fi
    
    # Create tar archive with compression
    if [[ $COMPRESSION_LEVEL -gt 0 ]]; then
        tar -czf "${backup_file}.gz" \
            "${config_paths[@]}" \
            2>/dev/null || true
        
        backup_file="${backup_file}.gz"
    else
        tar -cf "$backup_file" \
            "${config_paths[@]}" \
            2>/dev/null || true
    fi
    
    # Encrypt if enabled
    if [[ "$ENCRYPTION_ENABLED" == true ]]; then
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "${backup_file}.gpg" "$backup_file"
        rm "$backup_file"
        backup_file="${backup_file}.gpg"
    fi
    
    log "INFO" "Configuration backup completed: $backup_file"
    echo "$backup_file"
}

# Container backup function
backup_containers() {
    log "INFO" "Starting container backup..."
    
    if ! command -v docker &> /dev/null; then
        log "WARNING" "Docker not found, skipping container backup"
        return 0
    fi
    
    local backup_dir="$BACKUP_ROOT/containers/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Export running containers
    local containers=$(docker ps --format "{{.Names}}")
    
    for container in $containers; do
        log "INFO" "Backing up container: $container"
        
        # Export container
        docker export "$container" > "$backup_dir/${container}.tar"
        
        # Save container metadata
        docker inspect "$container" > "$backup_dir/${container}.json"
    done
    
    # Export Docker volumes
    local volumes=$(docker volume ls --format "{{.Name}}")
    
    for volume in $volumes; do
        log "INFO" "Backing up volume: $volume"
        
        # Create temporary container to access volume
        docker run --rm \
            -v "$volume":/backup-volume \
            -v "$backup_dir":/backup \
            alpine tar -czf "/backup/volume_${volume}.tar.gz" -C /backup-volume .
    done
    
    # Compress entire backup directory
    local archive_file="$BACKUP_ROOT/containers/containers_$(date +%Y%m%d_%H%M%S).tar"
    
    if [[ $COMPRESSION_LEVEL -gt 0 ]]; then
        tar -czf "${archive_file}.gz" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
        archive_file="${archive_file}.gz"
    else
        tar -cf "$archive_file" -C "$(dirname "$backup_dir")" "$(basename "$backup_dir")"
    fi
    
    # Cleanup temporary directory
    rm -rf "$backup_dir"
    
    # Encrypt if enabled
    if [[ "$ENCRYPTION_ENABLED" == true ]]; then
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "${archive_file}.gpg" "$archive_file"
        rm "$archive_file"
        archive_file="${archive_file}.gpg"
    fi
    
    log "INFO" "Container backup completed: $archive_file"
    echo "$archive_file"
}

# Verify backup function
verify_backup() {
    local backup_file=$1
    
    log "INFO" "Verifying backup: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        log "ERROR" "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check file size
    local file_size=$(stat -c%s "$backup_file")
    if [[ $file_size -eq 0 ]]; then
        log "ERROR" "Backup file is empty: $backup_file"
        return 1
    fi
    
    # Verify file integrity based on extension
    local extension="${backup_file##*.}"
    
    case "$extension" in
        gz)
            if ! gzip -t "$backup_file"; then
                log "ERROR" "Gzip integrity check failed: $backup_file"
                return 1
            fi
            ;;
        tar)
            if ! tar -tf "$backup_file" >/dev/null; then
                log "ERROR" "Tar integrity check failed: $backup_file"
                return 1
            fi
            ;;
        gpg)
            # For encrypted files, just check if they're valid GPG files
            if ! gpg --list-packets "$backup_file" >/dev/null 2>&1; then
                log "ERROR" "GPG integrity check failed: $backup_file"
                return 1
            fi
            ;;
    esac
    
    log "INFO" "Backup verification successful: $backup_file"
    return 0
}

# Upload to cloud storage
upload_to_cloud() {
    local backup_file=$1
    
    # AWS S3 upload
    if [[ "$AWS_S3_ENABLED" == true && -n "${AWS_S3_BUCKET:-}" ]]; then
        log "INFO" "Uploading to AWS S3: $AWS_S3_BUCKET"
        
        aws s3 cp "$backup_file" "s3://$AWS_S3_BUCKET/backups/$(basename "$backup_file")" \
            --storage-class STANDARD_IA
        
        log "INFO" "S3 upload completed"
    fi
    
    # Azure Blob upload
    if [[ "$AZURE_BLOB_ENABLED" == true && -n "${AZURE_STORAGE_ACCOUNT:-}" ]]; then
        log "INFO" "Uploading to Azure Blob Storage"
        
        az storage blob upload \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --container-name "${AZURE_CONTAINER_NAME:-backups}" \
            --name "$(basename "$backup_file")" \
            --file "$backup_file" \
            --tier Cool
        
        log "INFO" "Azure Blob upload completed"
    fi
    
    # Google Cloud Storage upload
    if [[ "$GCP_STORAGE_ENABLED" == true && -n "${GCP_BUCKET_NAME:-}" ]]; then
        log "INFO" "Uploading to Google Cloud Storage: $GCP_BUCKET_NAME"
        
        gsutil cp "$backup_file" "gs://$GCP_BUCKET_NAME/backups/"
        
        log "INFO" "GCS upload completed"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    if [[ "$CLEANUP_ENABLED" != true ]]; then
        return 0
    fi
    
    log "INFO" "Cleaning up old backups (retention: $RETENTION_DAYS days)"
    
    # Find and remove old backup files
    find "$BACKUP_ROOT" -type f -name "*.tar*" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_ROOT" -type f -name "*.sql*" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_ROOT" -type f -name "*.gpg" -mtime +$RETENTION_DAYS -delete
    
    # Remove empty directories
    find "$BACKUP_ROOT" -type d -empty -delete
    
    log "INFO" "Cleanup completed"
}

# Send notification
send_notification() {
    if [[ "$NOTIFICATION_ENABLED" != true ]]; then
        return 0
    fi
    
    local status=$1
    local message=$2
    local backup_files=$3
    
    # Calculate total backup size
    local total_size=0
    for file in $backup_files; do
        if [[ -f "$file" ]]; then
            local size=$(stat -c%s "$file")
            total_size=$((total_size + size))
        fi
    done
    
    local size_mb=$((total_size / 1024 / 1024))
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local payload=$(jq -n \
            --arg text "Backup $status" \
            --arg message "$message" \
            --arg size "${size_mb}MB" \
            --arg environment "${ENVIRONMENT:-production}" \
            '{
                text: $text,
                attachments: [{
                    color: ($text | contains("SUCCESS") | if . then "good" else "danger" end),
                    fields: [
                        {title: "Status", value: $message, short: false},
                        {title: "Total Size", value: $size, short: true},
                        {title: "Environment", value: $environment, short: true}
                    ]
                }]
            }')
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$payload" \
            "$SLACK_WEBHOOK_URL" &> /dev/null || true
    fi
    
    # Email notification
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo -e "Backup Status: $status\n\n$message\n\nTotal Size: ${size_mb}MB" | \
            mail -s "Backup Report - $(date)" "$NOTIFICATION_EMAIL" || true
    fi
}

# Main execution
main() {
    local backup_files=()
    local start_time=$(date +%s)
    
    log "INFO" "Starting backup process..."
    
    # Load configuration and check prerequisites
    load_config
    check_prerequisites
    
    # Database backups
    if [[ "$DATABASE_BACKUP" == true ]]; then
        if [[ -n "${MYSQL_DATABASES:-}" ]]; then
            for db in ${MYSQL_DATABASES//,/ }; do
                if backup_file=$(backup_mysql "$db"); then
                    backup_files+=("$backup_file")
                fi
            done
        fi
        
        if [[ -n "${POSTGRES_DATABASES:-}" ]]; then
            for db in ${POSTGRES_DATABASES//,/ }; do
                if backup_file=$(backup_postgresql "$db"); then
                    backup_files+=("$backup_file")
                fi
            done
        fi
        
        if [[ -n "${MONGODB_DATABASES:-}" ]]; then
            for db in ${MONGODB_DATABASES//,/ }; do
                if backup_file=$(backup_mongodb "$db"); then
                    backup_files+=("$backup_file")
                fi
            done
        fi
    fi
    
    # File backup
    if [[ "$FILE_BACKUP" == true ]]; then
        if backup_file=$(backup_files); then
            backup_files+=("$backup_file")
        fi
    fi
    
    # Configuration backup
    if [[ "$CONFIG_BACKUP" == true ]]; then
        if backup_file=$(backup_configurations); then
            backup_files+=("$backup_file")
        fi
    fi
    
    # Container backup
    if [[ "$CONTAINER_BACKUP" == true ]]; then
        if backup_file=$(backup_containers); then
            backup_files+=("$backup_file")
        fi
    fi
    
    # Verify backups
    local verification_failed=0
    if [[ "$VERIFY_BACKUP" == true ]]; then
        for backup_file in "${backup_files[@]}"; do
            if ! verify_backup "$backup_file"; then
                verification_failed=1
            fi
        done
    fi
    
    # Upload to cloud storage
    for backup_file in "${backup_files[@]}"; do
        upload_to_cloud "$backup_file"
    done
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Calculate execution time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Send notification
    if [[ $verification_failed -eq 0 && ${#backup_files[@]} -gt 0 ]]; then
        log "INFO" "Backup process completed successfully in ${duration}s"
        send_notification "SUCCESS" "All backups completed successfully in ${duration}s" "${backup_files[*]}"
    else
        log "ERROR" "Backup process failed or no backups created"
        send_notification "FAILED" "Backup process failed after ${duration}s" "${backup_files[*]}"
        exit 1
    fi
}

# Parse arguments and run
parse_args "$@"
main