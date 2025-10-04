<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\BookLoan;
use App\Models\ExamResult;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\TransportAssignment;
use Illuminate\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ReportsController extends Controller
{
    use AuthorizesRequests;

    public function dashboard(): JsonResponse
    {
        $this->authorize('viewAny', Student::class);

        $currentAcademicYear = AcademicYear::where('is_current', true)->first();
        
        if (!$currentAcademicYear) {
            return response()->json([
                'message' => 'No current academic year found',
            ], 404);
        }

        $stats = [
            'total_students' => Student::where('academic_year_id', $currentAcademicYear->id)->count(),
            'total_staff' => \App\Models\Staff::count(),
            'total_books' => \App\Models\Book::count(),
            'total_vehicles' => \App\Models\TransportVehicle::count(),
            'pending_fees' => FeeInvoice::where('status', 'pending')->sum('balance_amount'),
            'overdue_books' => BookLoan::where('status', 'overdue')->count(),
            'active_transport' => TransportAssignment::where('status', 'active')->count(),
        ];

        return response()->json([
            'data' => $stats,
            'message' => 'Dashboard statistics retrieved successfully',
        ]);
    }

    public function attendanceReport(Request $request): JsonResponse
    {
        $this->authorize('viewAny', StudentAttendance::class);

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        $query = StudentAttendance::with(['student.user', 'classroom', 'section'])
            ->whereBetween('attendance_date', [$request->start_date, $request->end_date]);

        if ($request->classroom_id) {
            $query->where('classroom_id', $request->classroom_id);
        }

        $attendance = $query->get();

        $summary = [
            'total_days' => $attendance->groupBy('attendance_date')->count(),
            'total_students' => $attendance->groupBy('student_id')->count(),
            'present_count' => $attendance->where('status', 'present')->count(),
            'absent_count' => $attendance->where('status', 'absent')->count(),
            'late_count' => $attendance->where('status', 'late')->count(),
            'attendance_percentage' => $attendance->count() > 0 
                ? round(($attendance->where('status', 'present')->count() / $attendance->count()) * 100, 2)
                : 0,
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'attendance' => $attendance,
            ],
            'message' => 'Attendance report generated successfully',
        ]);
    }

    public function examResultsReport(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExamResult::class);

        $request->validate([
            'exam_term_id' => 'required|exists:exam_terms,id',
            'classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        $query = ExamResult::with(['student.user', 'examTerm', 'examAssessment', 'subject'])
            ->where('exam_term_id', $request->exam_term_id);

        if ($request->classroom_id) {
            $query->whereHas('student.enrollments', function ($q) use ($request) {
                $q->where('classroom_id', $request->classroom_id);
            });
        }

        $results = $query->get();

        $summary = [
            'total_students' => $results->groupBy('student_id')->count(),
            'total_subjects' => $results->groupBy('subject_id')->count(),
            'passed_students' => $results->where('is_passed', true)->groupBy('student_id')->count(),
            'failed_students' => $results->where('is_passed', false)->groupBy('student_id')->count(),
            'average_marks' => $results->avg('marks_obtained'),
            'pass_percentage' => $results->count() > 0 
                ? round(($results->where('is_passed', true)->count() / $results->count()) * 100, 2)
                : 0,
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'results' => $results,
            ],
            'message' => 'Exam results report generated successfully',
        ]);
    }

    public function feeReport(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FeeInvoice::class);

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|in:pending,partially_paid,paid,overdue',
        ]);

        $query = FeeInvoice::with(['student.user', 'feeStructure'])
            ->whereBetween('issue_date', [$request->start_date, $request->end_date]);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $invoices = $query->get();

        $summary = [
            'total_invoices' => $invoices->count(),
            'total_amount' => $invoices->sum('total_amount'),
            'paid_amount' => $invoices->sum('paid_amount'),
            'pending_amount' => $invoices->sum('balance_amount'),
            'pending_count' => $invoices->where('status', 'pending')->count(),
            'paid_count' => $invoices->where('status', 'paid')->count(),
            'overdue_count' => $invoices->where('status', 'overdue')->count(),
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'invoices' => $invoices,
            ],
            'message' => 'Fee report generated successfully',
        ]);
    }

    public function libraryReport(Request $request): JsonResponse
    {
        $this->authorize('viewAny', BookLoan::class);

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $loans = BookLoan::with(['book', 'student.user', 'bookCopy'])
            ->whereBetween('loan_date', [$request->start_date, $request->end_date])
            ->get();

        $summary = [
            'total_loans' => $loans->count(),
            'returned_loans' => $loans->where('status', 'returned')->count(),
            'overdue_loans' => $loans->where('status', 'overdue')->count(),
            'active_loans' => $loans->where('status', 'active')->count(),
            'total_fines' => $loans->sum('fine_amount'),
            'paid_fines' => $loans->sum('fine_paid'),
            'pending_fines' => $loans->sum('fine_amount') - $loans->sum('fine_paid'),
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'loans' => $loans,
            ],
            'message' => 'Library report generated successfully',
        ]);
    }

    public function transportReport(Request $request): JsonResponse
    {
        $this->authorize('viewAny', TransportAssignment::class);

        $request->validate([
            'route_id' => 'nullable|exists:transport_routes,id',
            'status' => 'nullable|in:active,inactive,suspended,cancelled',
        ]);

        $query = TransportAssignment::with(['student.user', 'transportRoute', 'transportVehicle', 'pickupStop', 'dropStop']);

        if ($request->route_id) {
            $query->where('transport_route_id', $request->route_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $assignments = $query->get();

        $summary = [
            'total_assignments' => $assignments->count(),
            'active_assignments' => $assignments->where('status', 'active')->count(),
            'inactive_assignments' => $assignments->where('status', 'inactive')->count(),
            'total_monthly_fare' => $assignments->sum('monthly_fare'),
            'routes_utilized' => $assignments->groupBy('transport_route_id')->count(),
            'vehicles_utilized' => $assignments->groupBy('transport_vehicle_id')->count(),
        ];

        return response()->json([
            'data' => [
                'summary' => $summary,
                'assignments' => $assignments,
            ],
            'message' => 'Transport report generated successfully',
        ]);
    }
}
