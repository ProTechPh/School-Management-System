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
        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('content');
            $table->enum('type', ['general', 'academic', 'exam', 'fee', 'holiday', 'emergency', 'sports', 'cultural']);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('target_audience', ['all', 'students', 'staff', 'parents', 'specific_class', 'specific_section']);
            $table->json('target_classes')->nullable(); // For specific class targeting
            $table->json('target_sections')->nullable(); // For specific section targeting
            $table->date('publish_date');
            $table->date('expiry_date')->nullable();
            $table->boolean('is_published')->default(false);
            $table->boolean('is_pinned')->default(false);
            $table->foreignId('created_by')->constrained('staff')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['school_id', 'is_published', 'publish_date']);
            $table->index(['type', 'priority']);
            $table->index('target_audience');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notices');
    }
};
