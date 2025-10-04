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
        Schema::create('transport_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('transport_route_id')->constrained()->onDelete('cascade');
            $table->foreignId('transport_vehicle_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('pickup_stop_id')->constrained('transport_stops')->onDelete('cascade');
            $table->foreignId('drop_stop_id')->constrained('transport_stops')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('monthly_fare', 8, 2)->default(0);
            $table->enum('status', ['active', 'inactive', 'suspended', 'cancelled'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['student_id', 'status']);
            $table->index(['transport_route_id', 'status']);
            $table->index(['transport_vehicle_id', 'status']);
            $table->unique(['student_id', 'transport_route_id', 'start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transport_assignments');
    }
};
