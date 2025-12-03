<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add Region ID to Users Table Migration
 * 
 * Adds region_id column to users table for region-based access.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        // Check if column already exists
        if (Schema::hasColumn('users', 'region_id')) {
            return; // Column already exists, skip migration
        }

        Schema::table('users', function (Blueprint $table) {
            // Note: PostgreSQL doesn't support ->after(), column will be added at the end
            $table->unsignedBigInteger('region_id')->nullable();
        });

        // Add foreign key and index separately to avoid issues if regions table doesn't exist yet
        if (Schema::hasTable('regions')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('region_id')->references('id')->on('regions')->onDelete('set null');
                $table->index('region_id');
            });
        } else {
            // If regions table doesn't exist, just add index for now
            Schema::table('users', function (Blueprint $table) {
                $table->index('region_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['region_id']);
            $table->dropIndex(['region_id']);
            $table->dropColumn('region_id');
        });
    }
};

