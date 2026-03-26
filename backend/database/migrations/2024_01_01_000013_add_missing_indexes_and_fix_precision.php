<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds missing indexes for query performance and fixes decimal precision on farms.latitude.
     */
    public function up(): void
    {
        // Fix decimal precision for latitude (needs 10,8 to support -90 to 90)
        // 90 = 1 digit + 8 decimal places = precision 9, scale 8
        // But 10,8 allows for slightly larger values safely. Current was 10,8 which is fine,
        // but 11,8 is more accurate: -180.00000000 to 180.00000000 for longitude
        Schema::table('farms', function (Blueprint $table) {
            // Longitude: -180 to 180 needs 3 digits + 8 decimals = precision 11, scale 8
            $table->decimal('longitude', 11, 8)->nullable()->change();
        });

        // Add missing indexes for foreign keys commonly used in queries
        Schema::table('activities', function (Blueprint $table) {
            $table->index(['farm_id', 'user_id'], 'activities_farm_user_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->index(['farm_id', 'created_by'], 'tasks_farm_creator_idx');
            $table->index(['farm_id', 'status', 'due_date'], 'tasks_farm_status_due_idx');
        });

        Schema::table('problem_reports', function (Blueprint $table) {
            $table->index(['farm_id', 'reporter_id'], 'problem_reports_farm_reporter_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->decimal('longitude', 11, 8)->nullable()->change();
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex('activities_farm_user_idx');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex('tasks_farm_creator_idx');
            $table->dropIndex('tasks_farm_status_due_idx');
        });

        Schema::table('problem_reports', function (Blueprint $table) {
            $table->dropIndex('problem_reports_farm_reporter_idx');
        });
    }
};
