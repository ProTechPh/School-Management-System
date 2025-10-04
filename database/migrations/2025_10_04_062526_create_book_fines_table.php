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
        Schema::create('book_fines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_loan_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->enum('fine_type', ['overdue', 'damage', 'loss'])->default('overdue');
            $table->text('description')->nullable();
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'waived', 'cancelled'])->default('pending');
            $table->foreignId('waived_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->text('waived_reason')->nullable();
            $table->foreignId('collected_by')->nullable()->constrained('staff')->onDelete('set null');
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
        Schema::dropIfExists('book_fines');
    }
};
