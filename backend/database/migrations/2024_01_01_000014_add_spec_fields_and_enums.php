<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds missing fields per spec:
     * - plots: code, crop_type, total_plants, area, image_url, note
     * - plants: code, species, latest_image_url
     * - activities: image_url
     * - problem_reports: type (disease, pest, dead)
     */
    public function up(): void
    {
        // Add missing fields to plots
        Schema::table('plots', function (Blueprint $table) {
            if (!Schema::hasColumn('plots', 'code')) {
                $table->string('code')->nullable()->after('zone_id')->comment('Plot code/identifier');
            }
            if (!Schema::hasColumn('plots', 'crop_type')) {
                $table->string('crop_type')->nullable()->after('description')->comment('Type of crop planted');
            }
            if (!Schema::hasColumn('plots', 'total_plants')) {
                $table->integer('total_plants')->nullable()->after('crop_type')->default(0)->comment('Total number of plants');
            }
            if (!Schema::hasColumn('plots', 'area')) {
                $table->decimal('area', 10, 2)->nullable()->after('total_plants')->comment('Area in sqm (alias/synonym for size)');
            }
            if (!Schema::hasColumn('plots', 'image_url')) {
                $table->string('image_url')->nullable()->after('qr_code_data')->comment('Plot image URL');
            }
            if (!Schema::hasColumn('plots', 'note')) {
                $table->text('note')->nullable()->after('image_url')->comment('Additional notes');
            }
        });

        // Add missing fields to plants
        Schema::table('plants', function (Blueprint $table) {
            if (!Schema::hasColumn('plants', 'code')) {
                $table->string('code')->nullable()->after('plot_id')->comment('Plant code/identifier');
            }
            if (!Schema::hasColumn('plants', 'species')) {
                $table->string('species')->nullable()->after('variety')->comment('Plant species');
            }
            if (!Schema::hasColumn('plants', 'latest_image_url')) {
                $table->string('latest_image_url')->nullable()->after('notes')->comment('Latest plant image URL');
            }
        });

        // Add image_url to activities
        Schema::table('activities', function (Blueprint $table) {
            if (!Schema::hasColumn('activities', 'image_url')) {
                $table->string('image_url')->nullable()->after('metadata')->comment('Activity image URL');
            }
        });

        // Add type enum to problem_reports
        Schema::table('problem_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('problem_reports', 'type')) {
                $table->enum('type', ['disease', 'pest', 'dead'])->nullable()->after('plant_id')->comment('Problem type per spec');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plots', function (Blueprint $table) {
            $table->dropColumn(['code', 'crop_type', 'total_plants', 'area', 'image_url', 'note']);
        });

        Schema::table('plants', function (Blueprint $table) {
            $table->dropColumn(['code', 'species', 'latest_image_url']);
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->dropColumn(['image_url']);
        });

        Schema::table('problem_reports', function (Blueprint $table) {
            $table->dropColumn(['type']);
        });
    }
};
