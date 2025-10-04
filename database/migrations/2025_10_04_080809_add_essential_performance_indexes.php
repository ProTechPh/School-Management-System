<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add only the most essential performance indexes that don't already exist
        
        // Users table - add composite index for email and is_active
        Schema::table('users', function (Blueprint $table) {
            $table->index(['email', 'is_active']);
        });

        // Students table - add composite indexes for common queries
        Schema::table('students', function (Blueprint $table) {
            $table->index(['admission_number', 'is_active']);
            $table->index(['admission_date', 'is_active']);
        });

        // Staff table - add composite indexes for common queries
        Schema::table('staff', function (Blueprint $table) {
            $table->index(['employee_id', 'is_active']);
            $table->index(['school_id', 'is_active']);
        });

        // Enrollments table - add composite indexes for common queries
        Schema::table('enrollments', function (Blueprint $table) {
            $table->index(['classroom_id', 'section_id', 'status']);
            $table->index(['academic_year_id', 'status']);
        });

        // Student attendance - add date-based indexes
        Schema::table('student_attendance', function (Blueprint $table) {
            $table->index(['attendance_date', 'status']);
            $table->index(['classroom_id', 'attendance_date']);
        });

        // Staff attendance - add date-based indexes
        Schema::table('staff_attendance', function (Blueprint $table) {
            $table->index(['attendance_date', 'status']);
        });

        // Fee invoices - add date-based indexes
        Schema::table('fee_invoices', function (Blueprint $table) {
            $table->index(['due_date', 'status']);
            $table->index(['issue_date', 'status']);
        });

        // Fee payments - add date-based indexes
        Schema::table('fee_payments', function (Blueprint $table) {
            $table->index(['payment_date', 'status']);
        });

        // Book loans - add date-based indexes
        Schema::table('book_loans', function (Blueprint $table) {
            $table->index(['due_date', 'status']);
            $table->index(['loan_date', 'status']);
        });

        // Book fines - add date-based indexes
        Schema::table('book_fines', function (Blueprint $table) {
            $table->index(['due_date', 'status']);
        });

        // Transport assignments - add date-based indexes
        Schema::table('transport_assignments', function (Blueprint $table) {
            $table->index(['start_date', 'end_date']);
        });

        // Payroll - add date-based indexes
        Schema::table('payrolls', function (Blueprint $table) {
            $table->index(['pay_date', 'status']);
        });

        // Leave requests - add date-based indexes
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->index(['start_date', 'status']);
        });

        // Inventory transactions - add date-based indexes
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->index(['transaction_date', 'transaction_type']);
        });

        // Notices - add composite indexes for common queries
        Schema::table('notices', function (Blueprint $table) {
            $table->index(['is_published', 'publish_date']);
            $table->index(['type', 'priority']);
        });

        // Events - add composite indexes for common queries
        Schema::table('events', function (Blueprint $table) {
            $table->index(['event_date', 'is_published']);
            $table->index(['type', 'target_audience']);
        });

        // Messages - add composite indexes for common queries
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['type', 'priority']);
            $table->index(['is_scheduled', 'created_at']);
        });

        // Message recipients - add composite indexes for common queries
        Schema::table('message_recipients', function (Blueprint $table) {
            $table->index(['recipient_type', 'is_read']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes in reverse order
        
        // Message recipients
        Schema::table('message_recipients', function (Blueprint $table) {
            $table->dropIndex(['recipient_type', 'is_read']);
        });

        // Messages
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['type', 'priority']);
            $table->dropIndex(['is_scheduled', 'created_at']);
        });

        // Events
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['event_date', 'is_published']);
            $table->dropIndex(['type', 'target_audience']);
        });

        // Notices
        Schema::table('notices', function (Blueprint $table) {
            $table->dropIndex(['is_published', 'publish_date']);
            $table->dropIndex(['type', 'priority']);
        });

        // Inventory transactions
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropIndex(['transaction_date', 'transaction_type']);
        });

        // Leave requests
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropIndex(['start_date', 'status']);
        });

        // Payroll
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropIndex(['pay_date', 'status']);
        });

        // Transport assignments
        Schema::table('transport_assignments', function (Blueprint $table) {
            $table->dropIndex(['start_date', 'end_date']);
        });

        // Book fines
        Schema::table('book_fines', function (Blueprint $table) {
            $table->dropIndex(['due_date', 'status']);
        });

        // Book loans
        Schema::table('book_loans', function (Blueprint $table) {
            $table->dropIndex(['due_date', 'status']);
            $table->dropIndex(['loan_date', 'status']);
        });

        // Fee payments
        Schema::table('fee_payments', function (Blueprint $table) {
            $table->dropIndex(['payment_date', 'status']);
        });

        // Fee invoices
        Schema::table('fee_invoices', function (Blueprint $table) {
            $table->dropIndex(['due_date', 'status']);
            $table->dropIndex(['issue_date', 'status']);
        });

        // Staff attendance
        Schema::table('staff_attendance', function (Blueprint $table) {
            $table->dropIndex(['attendance_date', 'status']);
        });

        // Student attendance
        Schema::table('student_attendance', function (Blueprint $table) {
            $table->dropIndex(['attendance_date', 'status']);
            $table->dropIndex(['classroom_id', 'attendance_date']);
        });

        // Enrollments
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex(['classroom_id', 'section_id', 'status']);
            $table->dropIndex(['academic_year_id', 'status']);
        });

        // Staff
        Schema::table('staff', function (Blueprint $table) {
            $table->dropIndex(['employee_id', 'is_active']);
            $table->dropIndex(['school_id', 'is_active']);
        });

        // Students
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['admission_number', 'is_active']);
            $table->dropIndex(['admission_date', 'is_active']);
        });

        // Users
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['email', 'is_active']);
        });
    }
};