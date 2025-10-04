#!/bin/bash

# School Management System - Initial Setup Script
# This script sets up the application for the first time

set -e  # Exit on any error

echo "🏫 School Management System - Initial Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check if running in correct directory
if [ ! -f "artisan" ]; then
    print_error "This script must be run from the Laravel project root directory"
    exit 1
fi

print_header "Step 1: Environment Configuration"
echo "Setting up environment file..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    print_status "Created .env file from .env.example"
else
    print_warning ".env file already exists, skipping creation"
fi

print_header "Step 2: Composer Dependencies"
echo "Installing PHP dependencies..."
composer install

print_header "Step 3: Application Key"
echo "Generating application key..."
php artisan key:generate

print_header "Step 4: Database Configuration"
echo "Please ensure your database is configured in .env file"
echo "Database configuration:"
echo "- DB_CONNECTION=mysql"
echo "- DB_HOST=127.0.0.1"
echo "- DB_PORT=3306"
echo "- DB_DATABASE=your_database_name"
echo "- DB_USERNAME=your_username"
echo "- DB_PASSWORD=your_password"

read -p "Press Enter when database is configured..."

print_header "Step 5: Database Migration"
echo "Running database migrations..."
php artisan migrate

print_header "Step 6: Database Seeding"
echo "Seeding database with initial data..."
php artisan db:seed

print_header "Step 7: Storage Setup"
echo "Creating storage links..."
php artisan storage:link

print_header "Step 8: Cache Optimization"
echo "Optimizing application cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

print_header "Step 9: Permissions"
echo "Setting proper file permissions..."
if command -v chmod &> /dev/null; then
    chmod -R 775 storage bootstrap/cache
    print_status "File permissions set"
else
    print_warning "chmod not available, please set permissions manually:"
    echo "chmod -R 775 storage bootstrap/cache"
fi

print_header "Step 10: Testing"
echo "Running basic tests..."
if php artisan test --testsuite=Feature --filter=StudentManagementTest; then
    print_status "Basic tests passed"
else
    print_warning "Some tests failed, but setup can continue"
fi

echo ""
print_status "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Configure your web server to point to the 'public' directory"
echo "2. Set up SSL certificate for production"
echo "3. Configure email settings in .env"
echo "4. Set up backup procedures"
echo "5. Configure monitoring and logging"
echo ""
echo "Default admin credentials:"
echo "Email: admin@school.com"
echo "Password: password"
echo ""
echo "API Documentation: Available at /api/documentation (if enabled)"
echo "Health Check: Available at /api/health"
