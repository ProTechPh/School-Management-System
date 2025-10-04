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
        Schema::create('transport_route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transport_route_id')->constrained()->onDelete('cascade');
            $table->foreignId('transport_stop_id')->constrained()->onDelete('cascade');
            $table->integer('sequence_order');
            $table->time('arrival_time')->nullable();
            $table->time('departure_time')->nullable();
            $table->decimal('distance_from_previous', 8, 2)->default(0);
            $table->timestamps();
            
            $table->unique(['transport_route_id', 'transport_stop_id']);
            $table->unique(['transport_route_id', 'sequence_order']);
            $table->index(['transport_route_id', 'sequence_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transport_route_stops');
    }
};
