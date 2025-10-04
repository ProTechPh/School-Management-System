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
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('school_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('transaction_type', ['purchase', 'sale', 'adjustment', 'transfer', 'damage', 'return']);
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->string('reference_number')->nullable();
            $table->date('transaction_date');
            $table->text('notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('staff')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['inventory_item_id', 'transaction_date']);
            $table->index(['school_id', 'transaction_type']);
            $table->index('transaction_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
