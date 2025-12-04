<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remove Location Fields from Stories Table Migration
 * 
 * Removes address, latitude, and longitude columns from stories table
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Drop index first if it exists (before dropping columns)
        $connection = Schema::getConnection();
        try {
            $indexExists = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_stories_location'"
            );
            
            if ($indexExists) {
                $connection->statement('DROP INDEX IF EXISTS idx_stories_location');
            }
        } catch (\Exception $e) {
            // Index doesn't exist or already dropped, continue
        }

        Schema::table('stories', function (Blueprint $table) {
            // Check if columns exist before dropping
            $columnsToDrop = [];
            
            if (Schema::hasColumn('stories', 'address')) {
                $columnsToDrop[] = 'address';
            }
            if (Schema::hasColumn('stories', 'latitude')) {
                $columnsToDrop[] = 'latitude';
            }
            if (Schema::hasColumn('stories', 'longitude')) {
                $columnsToDrop[] = 'longitude';
            }
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('stories', function (Blueprint $table) {
            // Re-add columns if rolling back
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            // Re-add index
            $table->index(['latitude', 'longitude'], 'idx_stories_location');
        });
    }
};

