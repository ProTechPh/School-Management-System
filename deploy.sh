#!/bin/bash

# School Management System - Production Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

echo "🚀 Starting School Management System Deployment..."

# Configuration
PROJECT_DIR="/var/www/school-management"
BACKUP_DIR="/var/backups/school-management"
DATE=$(date +%Y%m%d_%H%M%S)

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

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory $PROJECT_DIR does not exist"
    exit 1
fi

print_status "Changing to project directory..."
cd $PROJECT_DIR

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup current database
print_status "Creating database backup..."
if command -v mysqldump &> /dev/null; then
    mysqldump -u root -p school_management > "$BACKUP_DIR/db_backup_$DATE.sql"
    print_status "Database backup created: $BACKUP_DIR/db_backup_$DATE.sql"
else
    print_warning "mysqldump not found, skipping database backup"
fi

# Backup current .env file
if [ -f ".env" ]; then
    cp .env "$BACKUP_DIR/env_backup_$DATE"
    print_status "Environment file backed up"
fi

# Pull latest changes from git
print_status "Pulling latest changes from repository..."
git pull origin main

# Install/Update Composer dependencies
print_status "Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

# Clear and cache configuration
print_status "Optimizing application..."
php artisan config:clear
php artisan config:cache
php artisan route:clear
php artisan route:cache
php artisan view:clear
php artisan view:cache

# Run database migrations
print_status "Running database migrations..."
php artisan migrate --force

# Run database seeders (only for initial setup)
if [ "$1" = "--seed" ]; then
    print_status "Running database seeders..."
    php artisan db:seed --force
fi

# Clear application cache
print_status "Clearing application cache..."
php artisan cache:clear

# Set proper permissions
print_status "Setting file permissions..."
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Restart web server (adjust based on your setup)
print_status "Restarting web server..."
if command -v systemctl &> /dev/null; then
    sudo systemctl reload nginx
    sudo systemctl reload php8.3-fpm
else
    print_warning "systemctl not found, please restart your web server manually"
fi

# Run queue workers (if using queues)
if [ -f "artisan" ]; then
    print_status "Restarting queue workers..."
    php artisan queue:restart
fi

# Health check
print_status "Performing health check..."
if curl -f -s http://localhost/api/health > /dev/null; then
    print_status "✅ Health check passed - Application is running correctly"
else
    print_warning "⚠️  Health check failed - Please verify the application manually"
fi

print_status "🎉 Deployment completed successfully!"
print_status "Backup files are stored in: $BACKUP_DIR"
print_status "Deployment timestamp: $DATE"

# Optional: Send notification (uncomment and configure as needed)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"School Management System deployed successfully!"}' \
#     YOUR_SLACK_WEBHOOK_URL
