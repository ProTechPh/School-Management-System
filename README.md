# School Management System

A comprehensive, modern school management system built with Laravel 11, featuring a robust RESTful API, advanced security, and scalable architecture. This system streamlines all aspects of educational institution management from student enrollment to financial operations.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ProTechPh/School-Management-System.git
cd school-management-system

# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database and run migrations
php artisan migrate --seed

# Start development servers
php artisan serve
npm run dev
```

Visit `http://localhost:8000` to access the application.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## Features

### 🎓 Core Academic Management
- **Student Management**: Complete student profiles with admission details, personal information, and academic records
- **Staff Management**: Teacher and staff profiles with roles, departments, and designations
- **Class & Section Management**: Flexible classroom and section organization
- **Subject Management**: Core and elective subject management
- **Academic Year Management**: Multi-year academic planning

### 📚 Academic Operations
- **Attendance System**: Daily and period-wise attendance tracking for students and staff
- **Exam Management**: Exam terms, assessments, and result management
- **Grading System**: Flexible grading scales and grade point calculations
- **Timetable Management**: Class schedules and teacher assignments

### 💰 Financial Management
- **Fee Structure**: Flexible fee structures for different classes and categories
- **Invoice Management**: Automated fee invoice generation and tracking
- **Payment Processing**: Multiple payment methods and offline payment support
- **Financial Ledger**: Complete transaction history and balance tracking

### 📖 Library Management
- **Book Catalog**: Comprehensive book database with categories and subjects
- **Book Copies**: Individual copy management with barcode support
- **Loan Management**: Book lending and return tracking
- **Fine System**: Automated fine calculation and collection

### 🚌 Transport Management
- **Route Management**: School bus routes with stops and timing
- **Vehicle Management**: Fleet management with driver assignments
- **Student Assignments**: Transport route assignments for students
- **Fare Management**: Monthly fare calculation and tracking

### 👥 Human Resources
- **Payroll Management**: Complete salary processing with components
- **Leave Management**: Leave request and approval workflow
- **Staff Records**: Comprehensive staff information management

### 📦 Inventory Management
- **Item Management**: School inventory catalog with categories
- **Stock Tracking**: Real-time stock levels and alerts
- **Supplier Management**: Vendor database and transaction history
- **Transaction Logs**: Complete inventory movement tracking

### 📢 Communication System
- **Notices**: School-wide announcements with targeting
- **Events**: Event management with scheduling and recurrence
- **Messaging**: Internal messaging system for staff, students, and parents
- **File Attachments**: Document and file sharing capabilities

## 🛠 Technology Stack

### Backend
- **Framework**: Laravel 11.0+
- **PHP**: 8.3+
- **Database**: MySQL 8.0+
- **Authentication**: Laravel Sanctum
- **Authorization**: Spatie Laravel Permission
- **Activity Logging**: Spatie Laravel Activitylog
- **API**: RESTful API with JSON responses

### Frontend
- **Build Tool**: Vite
- **CSS Framework**: Tailwind CSS
- **JavaScript**: ES6+ with modern tooling

### Development & Testing
- **Testing**: PHPUnit with feature and unit tests
- **Code Quality**: Laravel Pint, PHPStan
- **Documentation**: Comprehensive API and code documentation

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Caching**: Redis
- **Queue**: Laravel Queues with Redis

## 📦 Installation

### Prerequisites
- **PHP**: 8.3 or higher
- **Composer**: Latest version
- **MySQL**: 8.0 or higher
- **Node.js**: 18.x or higher
- **Redis**: For caching and queues

### Local Development Setup

#### Option 1: Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ProTechPh/School-Management-System.git
   cd school-management-system
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Environment configuration**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Database setup**
   Create a MySQL database and update `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=school_management
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

6. **Run database migrations and seeders**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

7. **Create storage link**
   ```bash
   php artisan storage:link
   ```

8. **Start development servers**
   ```bash
   # Terminal 1: Laravel server
   php artisan serve
   
   # Terminal 2: Asset compilation
   npm run dev
   ```

#### Option 2: Docker Setup

1. **Clone and setup**
   ```bash
   git clone https://github.com/ProTechPh/School-Management-System.git
   cd school-management-system
   cp .env.example .env
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Run initial setup**
   ```bash
   docker-compose exec app composer install
   docker-compose exec app npm install
   docker-compose exec app php artisan migrate --seed
   docker-compose exec app php artisan storage:link
   ```

Access the application at `http://localhost:8000`

### Production Setup

For production deployment, see our comprehensive [Deployment Guide](DEPLOYMENT.md).

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
All API endpoints require authentication using Laravel Sanctum tokens.

**Login Example:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "admin@demoschool.edu",
    "password": "password"
}
```

**Response:**
```json
{
    "data": {
        "user": {
            "id": 1,
            "name": "Admin User",
            "email": "admin@demoschool.edu",
            "roles": ["Admin"]
        },
        "token": "1|abc123def456..."
    },
    "message": "Login successful",
    "status": "success"
}
```

### Core Endpoints

#### 👥 Student Management
- `GET /api/v1/students` - List all students with pagination
- `POST /api/v1/students` - Create new student
- `GET /api/v1/students/{id}` - Get student details
- `PUT /api/v1/students/{id}` - Update student
- `DELETE /api/v1/students/{id}` - Delete student

#### 👨‍🏫 Staff Management
- `GET /api/v1/teachers` - List all staff members
- `POST /api/v1/teachers` - Create new staff member
- `GET /api/v1/teachers/{id}` - Get staff details
- `PUT /api/v1/teachers/{id}` - Update staff
- `DELETE /api/v1/teachers/{id}` - Delete staff

#### 📊 Attendance Management
- `GET /api/v1/student-attendance` - List attendance records
- `POST /api/v1/student-attendance` - Mark attendance
- `POST /api/v1/student-attendance/bulk` - Bulk attendance marking
- `GET /api/v1/student-attendance/summary` - Attendance summary
- `GET /api/v1/staff-attendance` - Staff attendance records
- `POST /api/v1/staff-attendance/check-in` - Staff check-in
- `POST /api/v1/staff-attendance/check-out` - Staff check-out

#### 📝 Exam Management
- `GET /api/v1/exam-results` - List exam results
- `POST /api/v1/exam-results` - Create exam result
- `POST /api/v1/exam-results/bulk` - Bulk result entry
- `GET /api/v1/exam-results/report-card` - Student report card
- `GET /api/v1/exam-results/class-results` - Class results

#### 💰 Fee Management
- `GET /api/v1/fee-invoices` - List fee invoices
- `POST /api/v1/fee-invoices` - Create fee invoice
- `POST /api/v1/fee-invoices/bulk` - Bulk invoice generation
- `GET /api/v1/fee-invoices/student-summary` - Student fee summary
- `POST /api/v1/fee-payments` - Record fee payment
- `GET /api/v1/fee-payments/summary` - Payment summary

#### 📖 Library Management
- `GET /api/v1/books` - List books with search and filters
- `POST /api/v1/books` - Add new book
- `GET /api/v1/book-loans` - List book loans
- `POST /api/v1/book-loans` - Issue book
- `POST /api/v1/book-loans/{id}/return` - Return book
- `GET /api/v1/book-loans/overdue` - Overdue books
- `GET /api/v1/book-fines` - List book fines
- `POST /api/v1/book-fines/{id}/pay` - Pay fine

#### 🚌 Transport Management
- `GET /api/v1/transport-routes` - List transport routes
- `POST /api/v1/transport-routes` - Create route
- `GET /api/v1/transport-vehicles` - List vehicles
- `GET /api/v1/transport-assignments` - List assignments
- `POST /api/v1/transport-assignments` - Assign student to route

#### 📈 Reports & Analytics
- `GET /api/v1/reports/dashboard` - Dashboard statistics
- `GET /api/v1/reports/attendance` - Attendance reports
- `GET /api/v1/reports/exam-results` - Exam result reports
- `GET /api/v1/reports/fees` - Fee reports
- `GET /api/v1/reports/library` - Library reports
- `GET /api/v1/reports/transport` - Transport reports

### Response Format
All API responses follow a consistent JSON format:

**Success Response:**
```json
{
    "data": {
        // Response data
    },
    "message": "Success message",
    "status": "success"
}
```

**Error Response:**
```json
{
    "message": "Error message",
    "errors": {
        "field": ["Validation error message"]
    }
}
```

For complete API documentation with examples, see [API Documentation](docs/API_DOCUMENTATION.md).

## 🏗 Architecture

### System Architecture
The School Management System follows a modern, scalable architecture:

- **MVC Pattern**: Clean separation of concerns with Laravel's MVC architecture
- **Service Layer**: Business logic encapsulated in dedicated service classes
- **Repository Pattern**: Data access abstraction for better testability
- **API-First Design**: RESTful API with comprehensive documentation
- **Microservice Ready**: Modular design allowing for future microservice extraction

### Database Design
- **Normalized Schema**: Optimized database design with proper relationships
- **Indexing Strategy**: Performance-optimized indexes for frequently queried fields
- **Data Integrity**: Foreign key constraints and validation rules
- **Audit Trail**: Complete activity logging for all operations

For detailed architecture information, see [Models Documentation](docs/MODELS_DOCUMENTATION.md) and [Services Documentation](docs/SERVICES_DOCUMENTATION.md).

## 🔐 Security

### Authentication & Authorization
- **Laravel Sanctum**: Token-based API authentication
- **Role-Based Access Control**: Granular permissions system
- **Multi-Factor Authentication**: Support for 2FA (configurable)
- **Session Management**: Secure session handling with Redis

### Data Protection
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Eloquent ORM with parameterized queries
- **XSS Protection**: Input sanitization and output escaping
- **CSRF Protection**: Built-in CSRF token validation
- **Rate Limiting**: API rate limiting to prevent abuse

### Security Features
- **Activity Logging**: Complete audit trail for all operations
- **Data Encryption**: Sensitive data encryption at rest
- **Secure Headers**: Security headers for web protection
- **File Upload Security**: Secure file handling with validation

## 🧪 Testing

### Test Coverage
The system includes comprehensive testing:

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --filter StudentManagementTest

# Run with coverage report
php artisan test --coverage

# Run tests in parallel
php artisan test --parallel
```

### Test Types
- **Unit Tests**: Individual method and class testing
- **Feature Tests**: Complete workflow testing
- **Integration Tests**: API endpoint testing
- **Browser Tests**: End-to-end testing with Laravel Dusk

### Test Data
```bash
# Seed test data
php artisan db:seed

# Seed specific data
php artisan db:seed --class=SchoolDataSeeder
```

## 🚀 Deployment

### Deployment Options
- **Local Development**: Docker Compose setup
- **Staging Environment**: Automated deployment pipeline
- **Production**: Multi-environment deployment support
- **Cloud Deployment**: AWS, DigitalOcean, Heroku support

### Performance Optimization
- **Database Indexing**: Optimized indexes for performance
- **Caching Strategy**: Redis caching for frequently accessed data
- **Asset Optimization**: Minified and compressed assets
- **CDN Integration**: Content delivery network support

For detailed deployment instructions, see [Deployment Guide](DEPLOYMENT.md).

## 📖 Documentation

### Available Documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)**: Complete API reference with examples
- **[Models Documentation](docs/MODELS_DOCUMENTATION.md)**: Database models and relationships
- **[Services Documentation](docs/SERVICES_DOCUMENTATION.md)**: Business logic and service classes
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)**: Development setup and guidelines
- **[Deployment Guide](DEPLOYMENT.md)**: Production deployment instructions

### User Roles & Permissions
The system includes comprehensive role-based access control:

- **👑 Admin**: Full system access and configuration
- **👨‍🏫 Teacher**: Student management, attendance, exam results
- **💰 Accountant**: Fee management and financial reports
- **📚 Librarian**: Library management and book operations
- **🚌 Transport Manager**: Transport route and vehicle management
- **👥 HR Manager**: Staff management, payroll, and leave requests
- **📦 Inventory Manager**: Inventory and supplier management
- **🎓 Student**: View own records and academic data
- **👨‍👩‍👧‍👦 Guardian**: View children's records and data

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](docs/DEVELOPMENT_GUIDE.md) for detailed information.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`php artisan test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Standards
- Follow PSR-12 coding standards
- Write comprehensive tests
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check our comprehensive documentation
- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

### Community
- **GitHub**: [Repository](https://github.com/ProTechPh/School-Management-System)
- **Issues**: [Bug Reports & Feature Requests](https://github.com/ProTechPh/School-Management-System/issues)
- **Discussions**: [Community Discussions](https://github.com/ProTechPh/School-Management-System/discussions)

---

**Built with ❤️ using Laravel 11 and modern web technologies**

*Last updated: Oct 2025*