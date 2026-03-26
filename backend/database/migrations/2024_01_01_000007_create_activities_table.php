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
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->morphs('activitable'); // activitable_id, activitable_type
            $table->enum('type', [
                'watering', 
                'fertilizing', 
                'pesticide', 
                'weeding', 
                'pruning', 
                'harvesting',
                'inspection',
                'planting',
                'soil_preparation',
                'other'
            ]);
            $table->text('description')->nullable();
            $table->decimal('quantity', 10, 2)->nullable()->comment('Amount used (fertilizer, pesticide, etc.)');
            $table->string('quantity_unit')->nullable()->comment('kg, liter, etc.');
            
            // Yield tracking fields (for harvest activities)
            $table->decimal('yield_amount', 10, 2)->nullable()->comment('Harvest yield amount');
            $table->string('yield_unit')->nullable()->comment('kg, ton, basket, etc.');
            $table->decimal('yield_price_per_unit', 12, 2)->nullable()->comment('Price per yield unit');
            $table->decimal('yield_total_value', 14, 2)->nullable()->comment('Total value of harvest');
            
            $table->json('metadata')->nullable()->comment('Additional data as JSON');
            $table->timestamp('activity_date')->useCurrent();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['activitable_type', 'activitable_id']);
            $table->index(['farm_id', 'type']);
            $table->index(['farm_id', 'activity_date']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
