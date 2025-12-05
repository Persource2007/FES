<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Add Organization ID to Users Table Migration
 * 
 * Adds organization_id column to users table and migrates from region-based to organization-based access.
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
        if (Schema::hasColumn('users', 'organization_id')) {
            return; // Column already exists, skip migration
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('organization_id')->nullable()->after('region_id');
        });

        // Add foreign key and index if organizations table exists
        if (Schema::hasTable('organizations')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('organization_id')
                    ->references('id')
                    ->on('organizations')
                    ->onDelete('set null')
                    ->onUpdate('cascade');
                $table->index('organization_id');
            });
        } else {
            // If organizations table doesn't exist, just add index for now
            Schema::table('users', function (Blueprint $table) {
                $table->index('organization_id');
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
        if (Schema::hasColumn('users', 'organization_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropForeign(['organization_id']);
                $table->dropIndex(['organization_id']);
                $table->dropColumn('organization_id');
            });
        }
    }
};

