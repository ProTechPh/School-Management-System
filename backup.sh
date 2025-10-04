#!/bin/bash

# School Management System - Backup Script
# This script creates backups of the database and important files

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/var/backups/school-management"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/var/www/school-management"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

print_status "Starting backup process..."

# Database backup
print_status "Creating database backup..."
if command -v mysqldump &> /dev/null; then
    # Get database credentials from .env file
    DB_DATABASE=$(grep DB_DATABASE .env | cut -d '=' -f2)
    DB_USERNAME=$(grep DB_USERNAME .env | cut -d '=' -f2)
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)
    
    mysqldump -u $DB_USERNAME -p$DB_PASSWORD $DB_DATABASE > "$BACKUP_DIR/db_backup_$DATE.sql"
    gzip "$BACKUP_DIR/db_backup_$DATE.sql"
    print_status "Database backup created: $BACKUP_DIR/db_backup_$DATE.sql.gz"
else
    print_error "mysqldump not found, skipping database backup"
fi

# Files backup
print_status "Creating files backup..."
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" \
    --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='storage/logs' \
    --exclude='storage/framework/cache' \
    --exclude='storage/framework/sessions' \
    --exclude='storage/framework/views' \
    --exclude='.git' \
    --exclude='.env' \
    .

print_status "Files backup created: $BACKUP_DIR/files_backup_$DATE.tar.gz"

# Storage backup (important files only)
print_status "Creating storage backup..."
tar -czf "$BACKUP_DIR/storage_backup_$DATE.tar.gz" \
    storage/app/public \
    storage/app/uploads \
    storage/app/documents

print_status "Storage backup created: $BACKUP_DIR/storage_backup_$DATE.tar.gz"

# Cleanup old backups
print_status "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

print_status "Backup process completed successfully!"
print_status "Backup files stored in: $BACKUP_DIR"

# Optional: Upload to cloud storage (uncomment and configure as needed)
# print_status "Uploading backups to cloud storage..."
# aws s3 cp "$BACKUP_DIR/db_backup_$DATE.sql.gz" s3://your-backup-bucket/
# aws s3 cp "$BACKUP_DIR/files_backup_$DATE.tar.gz" s3://your-backup-bucket/
# aws s3 cp "$BACKUP_DIR/storage_backup_$DATE.tar.gz" s3://your-backup-bucket/

# Optional: Send notification (uncomment and configure as needed)
# curl -X POST -H 'Content-type: application/json' \
#     --data "{\"text\":\"School Management System backup completed successfully!\"}" \
#     YOUR_SLACK_WEBHOOK_URL
