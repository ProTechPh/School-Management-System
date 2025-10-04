<?php

declare(strict_types=1);

use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\StudentsController;
use App\Http\Controllers\API\V1\TeachersController;
use App\Http\Controllers\API\V1\StudentAttendanceController;
use App\Http\Controllers\API\V1\StaffAttendanceController;
use App\Http\Controllers\API\V1\ExamResultController;
use App\Http\Controllers\API\V1\FeeInvoiceController;
use App\Http\Controllers\API\V1\FeePaymentController;
use App\Http\Controllers\API\V1\BooksController;
use App\Http\Controllers\API\V1\BookLoansController;
use App\Http\Controllers\API\V1\BookFinesController;
use App\Http\Controllers\API\V1\ReportsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->middleware(['api'])->group(function () {
    // Authentication routes
    Route::post('auth/login', [AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        
        // Students
        Route::apiResource('students', StudentsController::class);
        
        // Teachers
        Route::apiResource('teachers', TeachersController::class);
        
        // Student Attendance
        Route::apiResource('student-attendance', StudentAttendanceController::class);
        Route::post('student-attendance/bulk', [StudentAttendanceController::class, 'bulkStore']);
        Route::get('student-attendance/summary', [StudentAttendanceController::class, 'summary']);
        
               // Staff Attendance
               Route::apiResource('staff-attendance', StaffAttendanceController::class);
               Route::post('staff-attendance/check-in', [StaffAttendanceController::class, 'checkIn']);
               Route::post('staff-attendance/check-out', [StaffAttendanceController::class, 'checkOut']);
               Route::get('staff-attendance/summary', [StaffAttendanceController::class, 'summary']);

               // Exam Results
               Route::post('exam-results/bulk', [ExamResultController::class, 'bulkStore']);
               Route::get('exam-results/report-card', [ExamResultController::class, 'reportCard']);
               Route::get('exam-results/class-results', [ExamResultController::class, 'classResults']);
               Route::apiResource('exam-results', ExamResultController::class);

               // Fee Management
               Route::post('fee-invoices/bulk', [FeeInvoiceController::class, 'bulkStore']);
               Route::get('fee-invoices/student-summary', [FeeInvoiceController::class, 'studentSummary']);
               Route::get('fee-invoices/class-summary', [FeeInvoiceController::class, 'classSummary']);
               Route::apiResource('fee-invoices', FeeInvoiceController::class);
               
               Route::apiResource('fee-payments', FeePaymentController::class);
               Route::post('fee-payments/{feePayment}/confirm', [FeePaymentController::class, 'confirm']);
               Route::post('fee-payments/{feePayment}/cancel', [FeePaymentController::class, 'cancel']);
               Route::get('fee-payments/summary', [FeePaymentController::class, 'summary']);

               // Library Management
               Route::get('books/categories', [BooksController::class, 'categories']);
               Route::get('books/subjects', [BooksController::class, 'subjects']);
               Route::get('books/{book}/available-copies', [BooksController::class, 'availableCopies']);
               Route::apiResource('books', BooksController::class);

               Route::post('book-loans/{bookLoan}/return', [BookLoansController::class, 'return']);
               Route::get('book-loans/student-loans', [BookLoansController::class, 'studentLoans']);
               Route::get('book-loans/overdue', [BookLoansController::class, 'overdue']);
               Route::get('book-loans/statistics', [BookLoansController::class, 'statistics']);
               Route::apiResource('book-loans', BookLoansController::class);

               Route::post('book-fines/{bookFine}/pay', [BookFinesController::class, 'pay']);
               Route::post('book-fines/{bookFine}/waive', [BookFinesController::class, 'waive']);
               Route::get('book-fines/student-fines', [BookFinesController::class, 'studentFines']);
               Route::get('book-fines/overdue', [BookFinesController::class, 'overdue']);
               Route::post('book-fines/generate-overdue', [BookFinesController::class, 'generateOverdue']);
               Route::get('book-fines/statistics', [BookFinesController::class, 'statistics']);
               Route::apiResource('book-fines', BookFinesController::class);

               // Transport Management
               Route::apiResource('transport-routes', \App\Http\Controllers\API\V1\TransportRoutesController::class);
               Route::apiResource('transport-vehicles', \App\Http\Controllers\API\V1\TransportVehiclesController::class);
               Route::apiResource('transport-stops', \App\Http\Controllers\API\V1\TransportStopsController::class);
               Route::apiResource('transport-assignments', \App\Http\Controllers\API\V1\TransportAssignmentsController::class);
               Route::get('transport-routes/{route}/assignments', [\App\Http\Controllers\API\V1\TransportRoutesController::class, 'assignments']);

               // Reports
               Route::get('reports/dashboard', [ReportsController::class, 'dashboard']);
               Route::get('reports/attendance', [ReportsController::class, 'attendanceReport']);
               Route::get('reports/exam-results', [ReportsController::class, 'examResultsReport']);
               Route::get('reports/fees', [ReportsController::class, 'feeReport']);
               Route::get('reports/library', [ReportsController::class, 'libraryReport']);
               Route::get('reports/transport', [ReportsController::class, 'transportReport']);

               // Add more resource routes here as we implement them
    });
});
