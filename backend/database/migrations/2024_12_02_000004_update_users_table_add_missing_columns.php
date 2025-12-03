<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Update Users Table - Add Missing Columns
 * 
 * Adds any missing columns to the existing users table.
 * This migration is safe to run multiple times.
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
        // Add role_id if it doesn't exist
        if (!Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('role_id')->nullable()->after('password');
            });
            
            // Add index
            if (Schema::hasTable('roles')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->index('role_id');
                    // Add foreign key if roles table exists
                    try {
                        $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
                    } catch (\Exception $e) {
                        // Foreign key might already exist, ignore
                    }
                });
            } else {
                Schema::table('users', function (Blueprint $table) {
                    $table->index('role_id');
                });
            }
        }

        // Add region_id if it doesn't exist (will be handled by add_region_id migration, but this is a backup)
        if (!Schema::hasColumn('users', 'region_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->unsignedBigInteger('region_id')->nullable()->after('role_id');
            });
            
            // Add index (foreign key will be added after regions table is created)
            Schema::table('users', function (Blueprint $table) {
                $table->index('region_id');
            });
        }

        // Ensure created_at exists
        if (!Schema::hasColumn('users', 'created_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('created_at')->nullable();
            });
        }

        // Ensure updated_at exists
        if (!Schema::hasColumn('users', 'updated_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->timestamp('updated_at')->nullable();
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
        // Don't drop columns in down() to avoid data loss
        // If you need to rollback, do it manually
    }
};

