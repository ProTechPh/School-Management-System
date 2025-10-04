<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Attachment;
use App\Models\Book;
use App\Models\BookCopy;
use App\Models\Classroom;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Enrollment;
use App\Models\Event;
use App\Models\ExamAssessment;
use App\Models\ExamResult;
use App\Models\ExamTerm;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\Guardian;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\LeaveRequest;
use App\Models\Message;
use App\Models\MessageRecipient;
use App\Models\Notice;
use App\Models\Payroll;
use App\Models\School;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\Subject;
use App\Models\Supplier;
use App\Models\TransportAssignment;
use App\Models\TransportRoute;
use App\Models\TransportStop;
use App\Models\TransportVehicle;
use App\Models\User;
use Illuminate\Database\Seeder;

final class SchoolDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create school
        $school = School::factory()->create([
            'name' => 'Demo School',
            'code' => 'DS001',
            'address' => '123 Education Street, Learning City',
            'phone' => '+1-555-0123',
            'email' => 'info@demoschool.edu',
            'website' => 'https://demoschool.edu',
            'principal_name' => 'Dr. Jane Smith',
            'established_year' => 1995,
        ]);

        // Create academic year
        $academicYear = AcademicYear::factory()->create([
            'name' => '2024-2025',
            'start_date' => '2024-09-01',
            'end_date' => '2025-06-30',
            'is_current' => true,
        ]);

        // Create departments
        $departments = [
            ['name' => 'Mathematics', 'description' => 'Mathematics Department'],
            ['name' => 'Science', 'description' => 'Science Department'],
            ['name' => 'English', 'description' => 'English Department'],
            ['name' => 'Social Studies', 'description' => 'Social Studies Department'],
            ['name' => 'Physical Education', 'description' => 'Physical Education Department'],
        ];

        foreach ($departments as $dept) {
            Department::factory()->create([
                'school_id' => $school->id,
                'name' => $dept['name'],
                'description' => $dept['description'],
            ]);
        }

        // Create designations
        $designations = [
            ['name' => 'Principal', 'description' => 'School Principal'],
            ['name' => 'Vice Principal', 'description' => 'Vice Principal'],
            ['name' => 'Head Teacher', 'description' => 'Head Teacher'],
            ['name' => 'Teacher', 'description' => 'Class Teacher'],
            ['name' => 'Librarian', 'description' => 'School Librarian'],
            ['name' => 'Accountant', 'description' => 'School Accountant'],
            ['name' => 'Driver', 'description' => 'School Bus Driver'],
        ];

        foreach ($designations as $desig) {
            Designation::factory()->create([
                'school_id' => $school->id,
                'name' => $desig['name'],
                'description' => $desig['description'],
            ]);
        }

        // Create classrooms
        $classrooms = [];
        for ($i = 1; $i <= 12; $i++) {
            $classrooms[] = Classroom::factory()->create([
                'school_id' => $school->id,
                'name' => "Class {$i}",
                'code' => "C{$i}",
            ]);
        }

        // Create sections for each classroom
        $sections = [];
        foreach ($classrooms as $classroom) {
            for ($j = 0; $j < 3; $j++) {
                $sectionName = chr(65 + $j); // A, B, C
                $sections[] = Section::factory()->create([
                    'classroom_id' => $classroom->id,
                    'name' => "Section {$sectionName}",
                    'capacity' => 30,
                ]);
            }
        }

        // Create subjects
        $subjects = [
            ['name' => 'Mathematics', 'code' => 'MATH', 'type' => 'core'],
            ['name' => 'English', 'code' => 'ENG', 'type' => 'core'],
            ['name' => 'Science', 'code' => 'SCI', 'type' => 'core'],
            ['name' => 'Social Studies', 'code' => 'SS', 'type' => 'core'],
            ['name' => 'Physical Education', 'code' => 'PE', 'type' => 'core'],
            ['name' => 'Art', 'code' => 'ART', 'type' => 'elective'],
            ['name' => 'Music', 'code' => 'MUS', 'type' => 'elective'],
        ];

        foreach ($subjects as $subject) {
            Subject::factory()->create([
                'school_id' => $school->id,
                'name' => $subject['name'],
                'code' => $subject['code'],
                'type' => $subject['type'],
            ]);
        }

        // Create staff members
        $staff = Staff::factory(20)->create([
            'school_id' => $school->id,
        ]);

        // Create students
        $students = Student::factory(100)->create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
        ]);

        // Create guardians
        $guardians = Guardian::factory(80)->create();

        // Create enrollments
        foreach ($students as $index => $student) {
            $classroom = $classrooms[array_rand($classrooms)];
            $section = $sections[array_rand($sections)];
            
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'academic_year_id' => $academicYear->id,
                'classroom_id' => $classroom->id,
                'section_id' => $section->id,
                'enrollment_date' => '2024-09-01',
                'status' => 'active',
            ]);
        }

        // Create exam terms
        $examTerms = [
            ['name' => 'First Term Exam', 'start_date' => '2024-10-15', 'end_date' => '2024-10-25'],
            ['name' => 'Second Term Exam', 'start_date' => '2025-01-15', 'end_date' => '2025-01-25'],
            ['name' => 'Final Exam', 'start_date' => '2025-05-15', 'end_date' => '2025-05-25'],
        ];

        foreach ($examTerms as $term) {
            ExamTerm::factory()->create([
                'academic_year_id' => $academicYear->id,
                'name' => $term['name'],
                'start_date' => $term['start_date'],
                'end_date' => $term['end_date'],
            ]);
        }

        // Create fee structures
        FeeStructure::factory(10)->create([
            'school_id' => $school->id,
            'academic_year_id' => $academicYear->id,
        ]);

        // Create books
        $books = Book::factory(50)->create([
            'school_id' => $school->id,
        ]);

        // Create book copies
        foreach ($books as $book) {
            BookCopy::factory(rand(1, 5))->create([
                'book_id' => $book->id,
            ]);
        }

        // Create transport routes
        $routes = TransportRoute::factory(5)->create([
            'school_id' => $school->id,
        ]);

        // Create transport vehicles
        $vehicles = TransportVehicle::factory(8)->create([
            'school_id' => $school->id,
        ]);

        // Create transport stops
        $stops = TransportStop::factory(15)->create([
            'school_id' => $school->id,
        ]);

        // Create inventory items
        $inventoryItems = InventoryItem::factory(30)->create([
            'school_id' => $school->id,
        ]);

        // Create suppliers
        $suppliers = Supplier::factory(10)->create([
            'school_id' => $school->id,
        ]);

        // Create notices
        Notice::factory(20)->create([
            'school_id' => $school->id,
            'created_by' => $staff->random()->id,
        ]);

        // Create events
        Event::factory(15)->create([
            'school_id' => $school->id,
            'created_by' => $staff->random()->id,
        ]);

        // Create messages
        $messages = Message::factory(25)->create([
            'school_id' => $school->id,
        ]);

        // Create payroll records
        Payroll::factory(50)->create([
            'school_id' => $school->id,
        ]);

        // Create leave requests
        LeaveRequest::factory(30)->create([
            'school_id' => $school->id,
        ]);

        $this->command->info('School data seeded successfully!');
    }
}
