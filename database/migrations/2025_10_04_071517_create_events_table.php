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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('type', ['academic', 'sports', 'cultural', 'social', 'meeting', 'exam', 'holiday', 'other']);
            $table->date('event_date');
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->enum('target_audience', ['all', 'students', 'staff', 'parents', 'specific_class', 'specific_section']);
            $table->json('target_classes')->nullable();
            $table->json('target_sections')->nullable();
            $table->boolean('is_all_day')->default(false);
            $table->boolean('is_recurring')->default(false);
            $table->enum('recurrence_type', ['none', 'daily', 'weekly', 'monthly', 'yearly'])->default('none');
            $table->json('recurrence_pattern')->nullable();
            $table->date('recurrence_end_date')->nullable();
            $table->boolean('is_published')->default(false);
            $table->foreignId('created_by')->constrained('staff')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['school_id', 'event_date', 'is_published']);
            $table->index(['type', 'target_audience']);
            $table->index('is_recurring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
