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
        Schema::create('problem_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('plot_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('plant_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['reported', 'investigating', 'resolved', 'dismissed'])->default('reported');
            $table->string('title');
            $table->text('description');
            $table->text('symptoms')->nullable();
            $table->text('suspected_cause')->nullable();
            $table->text('resolution')->nullable();
            $table->string('image_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['farm_id', 'severity']);
            $table->index(['farm_id', 'status']);
            $table->index('reporter_id');
            $table->index('severity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('problem_reports');
    }
};
