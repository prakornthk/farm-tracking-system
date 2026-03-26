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
        Schema::create('plants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plot_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('variety')->nullable();
            $table->string('qr_code')->nullable();
            $table->string('qr_code_data')->nullable()->comment('Raw data encoded in QR');
            $table->date('planted_date')->nullable();
            $table->date('expected_harvest_date')->nullable();
            $table->enum('status', ['normal', 'problem', 'dead', 'harvested'])->default('normal');
            $table->integer('quantity')->default(1)->comment('Number of plants in this entry');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('plot_id');
            $table->index('status');
            $table->index('planted_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plants');
    }
};
