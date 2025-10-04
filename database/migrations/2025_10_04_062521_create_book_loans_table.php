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
        Schema::create('book_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained()->onDelete('cascade');
            $table->foreignId('book_copy_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('staff_id')->nullable()->constrained()->onDelete('cascade');
            $table->date('loan_date');
            $table->date('due_date');
            $table->datetime('returned_at')->nullable();
            $table->foreignId('returned_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->decimal('fine_amount', 10, 2)->default(0);
            $table->decimal('fine_paid', 10, 2)->default(0);
            $table->enum('status', ['active', 'returned', 'overdue', 'lost'])->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['student_id', 'status']);
            $table->index(['due_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_loans');
    }
};
