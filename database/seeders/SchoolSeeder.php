<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Classroom;
use App\Models\Department;
use App\Models\Designation;
use App\Models\School;
use App\Models\Section;
use App\Models\Subject;
use Illuminate\Database\Seeder;

final class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        // Create school
        $school = School::create([
            'name' => 'Demo School',
            'code' => 'DEMO001',
            'address' => '123 Education Street, Learning City, LC 12345',
            'phone' => '+1-555-0123',
            'email' => 'info@demoschool.edu',
            'website' => 'https://demoschool.edu',
            'principal_name' => 'Dr. Jane Smith',
            'established_year' => 1995,
            'is_active' => true,
        ]);

        // Create academic year
        $academicYear = AcademicYear::create([
            'school_id' => $school->id,
            'name' => '2024-2025',
            'start_date' => '2024-09-01',
            'end_date' => '2025-06-30',
            'is_current' => true,
        ]);

        // Create departments
        $departments = [
            ['name' => 'Administration', 'code' => 'ADMIN'],
            ['name' => 'Teaching', 'code' => 'TEACH'],
            ['name' => 'Support Staff', 'code' => 'SUPPORT'],
            ['name' => 'Maintenance', 'code' => 'MAINT'],
        ];

        foreach ($departments as $dept) {
            Department::create([
                'name' => $dept['name'],
                'code' => $dept['code'],
                'description' => "Department of {$dept['name']}",
                'is_active' => true,
            ]);
        }

        // Create designations
        $designations = [
            ['name' => 'Principal', 'code' => 'PRINCIPAL'],
            ['name' => 'Vice Principal', 'code' => 'VICE_PRINCIPAL'],
            ['name' => 'Head Teacher', 'code' => 'HEAD_TEACHER'],
            ['name' => 'Teacher', 'code' => 'TEACHER'],
            ['name' => 'Accountant', 'code' => 'ACCOUNTANT'],
            ['name' => 'Librarian', 'code' => 'LIBRARIAN'],
            ['name' => 'Driver', 'code' => 'DRIVER'],
            ['name' => 'Security Guard', 'code' => 'SECURITY'],
            ['name' => 'Cleaner', 'code' => 'CLEANER'],
        ];

        foreach ($designations as $desig) {
            Designation::create([
                'name' => $desig['name'],
                'code' => $desig['code'],
                'description' => $desig['name'] . ' position',
                'is_active' => true,
            ]);
        }

        // Create classes
        $classes = [
            ['name' => 'Nursery', 'code' => 'NUR'],
            ['name' => 'LKG', 'code' => 'LKG'],
            ['name' => 'UKG', 'code' => 'UKG'],
            ['name' => 'Grade 1', 'code' => 'G1'],
            ['name' => 'Grade 2', 'code' => 'G2'],
            ['name' => 'Grade 3', 'code' => 'G3'],
            ['name' => 'Grade 4', 'code' => 'G4'],
            ['name' => 'Grade 5', 'code' => 'G5'],
            ['name' => 'Grade 6', 'code' => 'G6'],
            ['name' => 'Grade 7', 'code' => 'G7'],
            ['name' => 'Grade 8', 'code' => 'G8'],
            ['name' => 'Grade 9', 'code' => 'G9'],
            ['name' => 'Grade 10', 'code' => 'G10'],
            ['name' => 'Grade 11', 'code' => 'G11'],
            ['name' => 'Grade 12', 'code' => 'G12'],
        ];

        foreach ($classes as $class) {
            Classroom::create([
                'school_id' => $school->id,
                'name' => $class['name'],
                'code' => $class['code'],
                'description' => "Class {$class['name']}",
                'is_active' => true,
            ]);
        }

        // Create sections for each class
        $sectionNames = ['A', 'B', 'C', 'D'];
        $classrooms = Classroom::all();

        foreach ($classrooms as $classroom) {
            foreach ($sectionNames as $sectionName) {
                Section::create([
                    'classroom_id' => $classroom->id,
                    'name' => $sectionName,
                    'code' => $classroom->code . $sectionName,
                    'capacity' => 40,
                    'is_active' => true,
                ]);
            }
        }

        // Create subjects
        $subjects = [
            ['name' => 'English', 'code' => 'ENG'],
            ['name' => 'Mathematics', 'code' => 'MATH'],
            ['name' => 'Science', 'code' => 'SCI'],
            ['name' => 'Social Studies', 'code' => 'SS'],
            ['name' => 'Hindi', 'code' => 'HINDI'],
            ['name' => 'Computer Science', 'code' => 'CS'],
            ['name' => 'Physical Education', 'code' => 'PE'],
            ['name' => 'Art', 'code' => 'ART'],
            ['name' => 'Music', 'code' => 'MUSIC'],
            ['name' => 'Physics', 'code' => 'PHY'],
            ['name' => 'Chemistry', 'code' => 'CHEM'],
            ['name' => 'Biology', 'code' => 'BIO'],
            ['name' => 'History', 'code' => 'HIST'],
            ['name' => 'Geography', 'code' => 'GEO'],
            ['name' => 'Economics', 'code' => 'ECON'],
        ];

        foreach ($subjects as $subject) {
            Subject::create([
                'name' => $subject['name'],
                'code' => $subject['code'],
                'description' => $subject['name'] . ' subject',
                'is_active' => true,
            ]);
        }
    }
}