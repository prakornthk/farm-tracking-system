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
        Schema::create('plots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('size', 10, 2)->nullable()->comment('Size in square meters or rai');
            $table->string('size_unit')->default('sqm')->comment('sqm, rai, or hectare');
            $table->string('qr_code')->nullable();
            $table->string('qr_code_data')->nullable()->comment('Raw data encoded in QR');
            $table->enum('status', ['active', 'inactive', 'harvested'])->default('active');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['zone_id', 'sort_order']);
            $table->index('status');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plots');
    }
};
