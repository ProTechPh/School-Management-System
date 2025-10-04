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
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('exam_term_id')->constrained()->onDelete('cascade');
            $table->foreignId('exam_assessment_id')->constrained()->onDelete('cascade');
            $table->foreignId('subject_id')->constrained()->onDelete('cascade');
            $table->decimal('marks_obtained', 5, 2);
            $table->string('grade', 5)->nullable();
            $table->decimal('grade_points', 3, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->boolean('is_passed')->default(false);
            $table->foreignId('entered_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->timestamps();
            
            // Unique constraint to prevent duplicate results for same student/assessment
            $table->unique(['student_id', 'exam_assessment_id'], 'unique_student_assessment_result');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};
