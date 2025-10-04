# School Management System - Deployment Guide

This guide provides comprehensive instructions for deploying the School Management System in various environments, from local development to production deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [SSL and Security](#ssl-and-security)
- [Backup and Recovery](#backup-and-recovery)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)
- [Scaling Considerations](#scaling-considerations)

## Prerequisites

### System Requirements

- **PHP**: 8.3 or higher
- **MySQL**: 8.0 or higher
- **Composer**: Latest version
- **Node.js**: 18.x or higher (for asset compilation)
- **Web Server**: Nginx or Apache
- **SSL Certificate**: For production environments

### PHP Extensions

- BCMath
- Ctype
- cURL
- DOM
- Fileinfo
- JSON
- Mbstring
- OpenSSL
- PCRE
- PDO
- Tokenizer
- XML
- GD
- Zip

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ProTechPh/School-Management-System.git
cd school-management-system
```

### 2. Install Dependencies

```bash
composer install
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Database Setup

Configure your database settings in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=school_management
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 5. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

### 6. Start Development Server

```bash
php artisan serve
```

The application will be available at `http://localhost:8000`

## Production Deployment

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install nginx mysql-server php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd composer nodejs npm -y
```

### 2. Database Setup

```bash
# Create database and user
mysql -u root -p
CREATE DATABASE school_management;
CREATE USER 'school_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON school_management.* TO 'school_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Application Deployment

```bash
# Clone repository
git clone https://github.com/ProTechPh/School-Management-System.git /var/www/school-management
cd /var/www/school-management

# Set permissions
sudo chown -R www-data:www-data /var/www/school-management
sudo chmod -R 755 /var/www/school-management

# Install dependencies
composer install --no-dev --optimize-autoloader
npm install && npm run build

# Configure environment
cp .env.production .env
# Edit .env with production settings
php artisan key:generate

# Run migrations and seeders
php artisan migrate --force
php artisan db:seed --force

# Optimize application
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/school-management`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/school-management/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\. {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com
```

### 6. Automated Deployment

Use the provided deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

## Docker Deployment

### 1. Using Docker Compose

```bash
# Clone repository
git clone https://github.com/ProTechPh/School-Management-System.git
cd school-management-system

# Configure environment
cp .env.example .env
# Edit .env with Docker settings

# Start services
docker-compose up -d

# Run initial setup
docker-compose exec app php artisan migrate --seed
```

### 2. Manual Docker Setup

```bash
# Build image
docker build -t school-management .

# Run database
docker run -d --name school-db -e MYSQL_ROOT_PASSWORD=root_password -e MYSQL_DATABASE=school_management mysql:8.0

# Run application
docker run -d --name school-app --link school-db:db -p 8000:9000 school-management
```

## Backup and Recovery

### Automated Backup

Set up automated backups using the provided script:

```bash
# Make script executable
chmod +x backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Manual Backup

```bash
# Database backup
mysqldump -u username -p school_management > backup.sql

# Files backup
tar -czf files_backup.tar.gz --exclude='vendor' --exclude='node_modules' .
```

### Recovery

```bash
# Restore database
mysql -u username -p school_management < backup.sql

# Restore files
tar -xzf files_backup.tar.gz
```

## Monitoring and Maintenance

### 1. Log Monitoring

```bash
# Application logs
tail -f storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 2. Performance Monitoring

- Monitor database performance
- Check disk space usage
- Monitor memory usage
- Set up uptime monitoring

### 3. Regular Maintenance

```bash
# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Update dependencies
composer update
npm update

# Run tests
php artisan test
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   ```bash
   sudo chown -R www-data:www-data /var/www/school-management
   sudo chmod -R 755 /var/www/school-management
   ```

2. **Database Connection Issues**
   - Check database credentials in `.env`
   - Verify database server is running
   - Check firewall settings

3. **Cache Issues**
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan route:clear
   php artisan view:clear
   ```

4. **Storage Issues**
   ```bash
   php artisan storage:link
   sudo chmod -R 775 storage
   ```

### Health Checks

- Application health: `GET /api/health`
- Database connectivity: Check logs
- File permissions: Verify storage directory

### Support

For additional support:
- Check application logs in `storage/logs/`
- Review web server error logs
- Verify environment configuration
- Test database connectivity

## Security Considerations

1. **Environment Security**
   - Use strong database passwords
   - Enable SSL/TLS
   - Configure proper file permissions
   - Regular security updates

2. **Application Security**
   - Keep dependencies updated
   - Use strong API keys
   - Implement rate limiting
   - Regular security audits

3. **Server Security**
   - Configure firewall
   - Regular system updates
   - Monitor access logs
   - Implement intrusion detection

## Performance Optimization

### Database Optimization

#### Indexing Strategy
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_admission_date ON students(admission_date);
CREATE INDEX idx_attendance_date_student ON student_attendances(date, student_id);
CREATE INDEX idx_fee_invoices_due_date ON fee_invoices(due_date);
CREATE INDEX idx_book_loans_due_date ON book_loans(due_date);
```

#### Query Optimization
```php
// Use eager loading to prevent N+1 queries
$students = Student::with(['user', 'guardians.user', 'enrollments'])->get();

// Use specific selects
$students = Student::select(['id', 'student_id', 'user_id'])->get();

// Use database transactions for bulk operations
DB::transaction(function () {
    // Bulk operations
});
```

#### Database Configuration
```ini
# MySQL Configuration (/etc/mysql/mysql.conf.d/mysqld.cnf)
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
query_cache_size = 64M
query_cache_type = 1
max_connections = 200
```

### Application Optimization

#### Caching Strategy
```php
// Redis Configuration
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

// Cache frequently accessed data
Cache::remember('book_categories', 3600, function () {
    return Book::distinct()->pluck('category');
});

// Cache API responses
Route::middleware('cache.headers:public;max_age=300')->group(function () {
    Route::get('/api/v1/books/categories', [BooksController::class, 'categories']);
});
```

#### Asset Optimization
```bash
# Compile and minify assets
npm run build

# Enable gzip compression in Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

#### Queue Configuration
```php
// Use Redis for queues
QUEUE_CONNECTION=redis

// Process queues in background
php artisan queue:work --daemon
```

### Server Optimization

#### PHP-FPM Configuration
```ini
# /etc/php/8.3/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 1000
```

#### Nginx Optimization
```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 1024;

# Enable keepalive
keepalive_timeout 65;
keepalive_requests 100;

# Enable gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Cloud Deployment

### AWS Deployment

#### EC2 Instance Setup
```bash
# Launch EC2 instance (Ubuntu 22.04 LTS)
# Instance type: t3.medium or larger
# Security groups: HTTP (80), HTTPS (443), SSH (22)

# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install nginx mysql-server php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd composer nodejs npm redis-server -y
```

#### RDS Database Setup
```bash
# Create RDS MySQL instance
# Engine: MySQL 8.0
# Instance class: db.t3.micro (for development)
# Storage: 20GB minimum
# Enable automated backups
# Configure security groups
```

#### S3 for File Storage
```php
// Configure S3 in .env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=your-bucket-name
```

#### CloudFront CDN
```bash
# Create CloudFront distribution
# Origin: Your application domain
# Enable gzip compression
# Configure caching behaviors
```

### DigitalOcean Deployment

#### Droplet Setup
```bash
# Create Droplet (Ubuntu 22.04)
# Size: 2GB RAM minimum
# Add SSH key
# Enable backups

# Connect to droplet
ssh root@your-droplet-ip

# Install LEMP stack
curl -fsSL https://packages.sury.org/php/apt.gpg | sudo apt-key add -
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/php.list
sudo apt update
sudo apt install nginx mysql-server php8.3-fpm php8.3-mysql php8.3-xml php8.3-mbstring php8.3-curl php8.3-zip php8.3-gd composer nodejs npm redis-server -y
```

#### Managed Database
```bash
# Create managed MySQL database
# Size: 1GB RAM minimum
# Enable automated backups
# Configure connection pooling
```

### Heroku Deployment

#### Heroku Setup
```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-school-management-app

# Add buildpacks
heroku buildpacks:add heroku/php
heroku buildpacks:add heroku/nodejs
```

#### Environment Configuration
```bash
# Set environment variables
heroku config:set APP_KEY=your-app-key
heroku config:set DB_CONNECTION=mysql
heroku config:set DB_HOST=your-db-host
heroku config:set DB_DATABASE=your-db-name
heroku config:set DB_USERNAME=your-db-user
heroku config:set DB_PASSWORD=your-db-password
```

#### Database Setup
```bash
# Add MySQL addon
heroku addons:create cleardb:ignite

# Run migrations
heroku run php artisan migrate --seed
```

## Environment Configuration

### Production Environment Variables

```env
# Application
APP_NAME="School Management System"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password

# Cache
CACHE_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Queue
QUEUE_CONNECTION=redis

# Mail
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

# File Storage
FILESYSTEM_DISK=local
# For S3: FILESYSTEM_DISK=s3

# Logging
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

# Session
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=null

# Sanctum
SANCTUM_STATEFUL_DOMAINS=your-domain.com
```

### Staging Environment

```env
# Staging configuration
APP_ENV=staging
APP_DEBUG=true
APP_URL=https://staging.your-domain.com

# Use separate database
DB_DATABASE=school_management_staging

# Use separate Redis
REDIS_DATABASE=1
```

## Database Setup

### Production Database Configuration

#### MySQL Configuration
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
# Basic settings
bind-address = 127.0.0.1
port = 3306
socket = /var/run/mysqld/mysqld.sock

# Performance settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_file_per_table = 1

# Query cache
query_cache_size = 64M
query_cache_type = 1

# Connections
max_connections = 200
max_connect_errors = 10000

# Security
local-infile = 0
```

#### Database User Setup
```sql
-- Create database
CREATE DATABASE school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'school_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON school_management.* TO 'school_user'@'localhost';
FLUSH PRIVILEGES;

-- Create backup user
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON school_management.* TO 'backup_user'@'localhost';
```

### Database Optimization

#### Index Creation
```sql
-- Add performance indexes
ALTER TABLE students ADD INDEX idx_student_id (student_id);
ALTER TABLE students ADD INDEX idx_admission_date (admission_date);
ALTER TABLE student_attendances ADD INDEX idx_date_student (date, student_id);
ALTER TABLE fee_invoices ADD INDEX idx_due_date (due_date);
ALTER TABLE book_loans ADD INDEX idx_due_date (due_date);
ALTER TABLE book_loans ADD INDEX idx_status (status);
```

#### Partitioning (for large tables)
```sql
-- Partition attendance table by month
ALTER TABLE student_attendances 
PARTITION BY RANGE (YEAR(date) * 100 + MONTH(date)) (
    PARTITION p202401 VALUES LESS THAN (202402),
    PARTITION p202402 VALUES LESS THAN (202403),
    -- Add more partitions as needed
);
```

## SSL and Security

### SSL Certificate Setup

#### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Commercial SSL Certificate
```bash
# Upload certificate files
sudo cp your-certificate.crt /etc/ssl/certs/
sudo cp your-private-key.key /etc/ssl/private/
sudo cp your-ca-bundle.crt /etc/ssl/certs/

# Update Nginx configuration
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/your-certificate.crt;
    ssl_certificate_key /etc/ssl/private/your-private-key.key;
    ssl_trusted_certificate /etc/ssl/certs/your-ca-bundle.crt;
}
```

### Security Hardening

#### Firewall Configuration
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### PHP Security
```ini
# /etc/php/8.3/fpm/php.ini
expose_php = Off
allow_url_fopen = Off
allow_url_include = Off
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
```

#### Nginx Security Headers
```nginx
# Add security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

# Hide Nginx version
server_tokens off;
```

## Scaling Considerations

### Horizontal Scaling

#### Load Balancer Setup
```nginx
# Nginx load balancer configuration
upstream app_servers {
    server 10.0.1.10:9000;
    server 10.0.1.11:9000;
    server 10.0.1.12:9000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Database Replication
```sql
-- Master server configuration
[mysqld]
server-id = 1
log-bin = mysql-bin
binlog-format = ROW

-- Slave server configuration
[mysqld]
server-id = 2
relay-log = mysql-relay-bin
read-only = 1
```

#### Redis Cluster
```bash
# Redis cluster setup
redis-cli --cluster create 10.0.1.10:7000 10.0.1.11:7000 10.0.1.12:7000 \
  10.0.1.10:7001 10.0.1.11:7001 10.0.1.12:7001 \
  --cluster-replicas 1
```

### Vertical Scaling

#### Server Specifications
- **Development**: 2 CPU, 4GB RAM, 50GB SSD
- **Staging**: 4 CPU, 8GB RAM, 100GB SSD
- **Production**: 8 CPU, 16GB RAM, 200GB SSD
- **High Traffic**: 16 CPU, 32GB RAM, 500GB SSD

#### Database Scaling
- **Small**: 2 CPU, 4GB RAM, 100GB SSD
- **Medium**: 4 CPU, 8GB RAM, 200GB SSD
- **Large**: 8 CPU, 16GB RAM, 500GB SSD
- **Enterprise**: 16 CPU, 32GB RAM, 1TB SSD

### Monitoring and Alerting

#### Application Monitoring
```bash
# Install New Relic
wget -O - https://download.newrelic.com/548C16BF.gpg | sudo apt-key add -
echo "deb http://apt.newrelic.com/debian/ newrelic non-free" | sudo tee /etc/apt/sources.list.d/newrelic.list
sudo apt update
sudo apt install newrelic-php5
```

#### Server Monitoring
```bash
# Install htop for process monitoring
sudo apt install htop

# Install iotop for I/O monitoring
sudo apt install iotop

# Install nethogs for network monitoring
sudo apt install nethogs
```

#### Log Monitoring
```bash
# Install logrotate
sudo apt install logrotate

# Configure log rotation
sudo nano /etc/logrotate.d/school-management
```

```bash
# /etc/logrotate.d/school-management
/var/www/school-management/storage/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

---

**Last Updated:** January 2024  
**Laravel Version:** 11.0+  
**PHP Version:** 8.3+
