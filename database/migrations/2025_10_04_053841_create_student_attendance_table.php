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
        Schema::create('student_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('academic_year_id')->constrained()->onDelete('cascade');
            $table->foreignId('classroom_id')->constrained()->onDelete('cascade');
            $table->foreignId('section_id')->constrained()->onDelete('cascade');
            $table->date('attendance_date');
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('present');
            $table->string('period')->nullable(); // For period-wise attendance
            $table->foreignId('subject_id')->nullable()->constrained()->onDelete('set null');
            $table->text('remarks')->nullable();
            $table->foreignId('marked_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->timestamps();
            
            // Unique constraint to prevent duplicate attendance for same student/date/period
            $table->unique(['student_id', 'attendance_date', 'period'], 'unique_student_attendance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_attendance');
    }
};
