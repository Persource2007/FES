<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Change All CASCADE Foreign Keys to SET NULL
 * 
 * Changes all foreign key constraints with CASCADE delete to SET NULL
 * and ensures related columns are nullable. This prevents automatic
 * data deletion and preserves records when parent records are deleted.
 * 
 * Affected tables:
 * - sessions.user_id
 * - role_permissions.role_id (SKIPPED - handle manually, see comments in migration)
 * - role_permissions.permission_id (SKIPPED - handle manually, see comments in migration)
 * - category_regions.category_id
 * - category_regions.region_id
 * - category_organizations.category_id
 * - category_organizations.organization_id
 * - activities.user_id (if table exists)
 * 
 * Note: Some tables (role_permissions, activities) may require special permissions.
 * If you get permission errors, run the ownership fix SQL in fix_table_ownership.sql
 * before running this migration.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        
        // Helper function to drop foreign key constraint
        $dropForeignKey = function ($tableName, $columnName) use ($driver) {
            if ($driver === 'pgsql') {
                // PostgreSQL: Find the actual constraint name
                $constraint = DB::selectOne("
                    SELECT conname 
                    FROM pg_constraint 
                    WHERE conrelid = '{$tableName}'::regclass 
                    AND contype = 'f'
                    AND pg_get_constraintdef(oid) LIKE '%{$columnName}%'
                    LIMIT 1
                ");
                
                if ($constraint && isset($constraint->conname)) {
                    DB::statement("ALTER TABLE {$tableName} DROP CONSTRAINT IF EXISTS \"{$constraint->conname}\"");
                }
            } else {
                // MySQL: Try Laravel's default naming
                Schema::table($tableName, function (Blueprint $table) use ($columnName) {
                    try {
                        $table->dropForeign([$columnName]);
                    } catch (\Exception $e) {
                        // Constraint might not exist or have different name, skip
                    }
                });
            }
        };
        
        // Helper function to make column nullable and add SET NULL foreign key
        $setNullForeignKey = function ($tableName, $columnName, $referencesTable, $referencesColumn = 'id', $skipIfNoPermission = false) use ($dropForeignKey, $driver) {
            if (!Schema::hasTable($tableName)) {
                return;
            }
            
            try {
                // Drop existing foreign key
                $dropForeignKey($tableName, $columnName);
                
                // Make column nullable
                Schema::table($tableName, function (Blueprint $table) use ($columnName) {
                    $table->unsignedBigInteger($columnName)->nullable()->change();
                });
                
                // Add new foreign key with SET NULL
                Schema::table($tableName, function (Blueprint $table) use ($columnName, $referencesTable, $referencesColumn) {
                    $table->foreign($columnName)
                        ->references($referencesColumn)
                        ->on($referencesTable)
                        ->onDelete('set null')
                        ->onUpdate('cascade');
                });
            } catch (\Exception $e) {
                if ($skipIfNoPermission && (strpos($e->getMessage(), 'permission') !== false || strpos($e->getMessage(), 'privilege') !== false)) {
                    \Log::warning("Skipping {$tableName}.{$columnName} - insufficient permissions. Please handle manually: " . $e->getMessage());
                    return;
                }
                throw $e; // Re-throw if not a permission error or if we shouldn't skip
            }
        };
        
        // 1. sessions.user_id
        if (Schema::hasTable('sessions')) {
            $setNullForeignKey('sessions', 'user_id', 'users');
        }
        
        // 2. role_permissions.role_id
        if (Schema::hasTable('role_permissions')) {
            $setNullForeignKey('role_permissions', 'role_id', 'roles', 'id', true);
        }
        
        // 3. role_permissions.permission_id
        if (Schema::hasTable('role_permissions')) {
            $setNullForeignKey('role_permissions', 'permission_id', 'permissions', 'id', true);
        }
        
        // 4. category_regions.category_id
        if (Schema::hasTable('category_regions')) {
            $setNullForeignKey('category_regions', 'category_id', 'story_categories');
        }
        
        // 5. category_regions.region_id
        if (Schema::hasTable('category_regions')) {
            $setNullForeignKey('category_regions', 'region_id', 'regions');
        }
        
        // 6. category_organizations.category_id
        if (Schema::hasTable('category_organizations')) {
            $setNullForeignKey('category_organizations', 'category_id', 'story_categories');
        }
        
        // 7. category_organizations.organization_id
        if (Schema::hasTable('category_organizations')) {
            $setNullForeignKey('category_organizations', 'organization_id', 'organizations');
        }
        
        // 8. activities.user_id (skip if no permission - handle manually)
        if (Schema::hasTable('activities')) {
            $setNullForeignKey('activities', 'user_id', 'users', 'id', true);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Note: Reverting would restore CASCADE behavior
        // This is intentionally left as a no-op since we want to preserve data
        // If you need to revert, you'll need to manually restore CASCADE constraints
    }
};
