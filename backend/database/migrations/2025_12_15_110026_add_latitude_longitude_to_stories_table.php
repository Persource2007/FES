<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add Latitude and Longitude to Stories Table Migration
 * 
 * Adds latitude and longitude columns to stories table for precise pinpoint mapping.
 * These columns allow each story to have its exact geographic coordinates.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            // Add latitude and longitude columns if they don't exist
            if (!Schema::hasColumn('stories', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('village_name');
            }
            if (!Schema::hasColumn('stories', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }
        });
        
        // Add index for location-based queries
        $connection = Schema::getConnection();
        try {
            $indexExists = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_stories_location'"
            );
            
            if (!$indexExists) {
                $connection->statement('CREATE INDEX idx_stories_location ON stories (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL');
            }
        } catch (\Exception $e) {
            // Index creation failed, continue (might already exist or table doesn't exist yet)
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop index first
        $connection = Schema::getConnection();
        try {
            $indexExists = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_stories_location'"
            );
            
            if ($indexExists) {
                $connection->statement('DROP INDEX IF EXISTS idx_stories_location');
            }
        } catch (\Exception $e) {
            // Index doesn't exist, continue
        }
        
        Schema::table('stories', function (Blueprint $table) {
            if (Schema::hasColumn('stories', 'latitude')) {
                $table->dropColumn('latitude');
            }
            if (Schema::hasColumn('stories', 'longitude')) {
                $table->dropColumn('longitude');
            }
        });
    }
};
