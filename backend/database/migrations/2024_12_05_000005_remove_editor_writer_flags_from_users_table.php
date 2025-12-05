<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remove Editor and Writer Flags from Users Table Migration
 * 
 * Removes is_editor and is_writer columns from users table.
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
        if (Schema::hasColumn('users', 'is_editor') || Schema::hasColumn('users', 'is_writer')) {
            Schema::table('users', function (Blueprint $table) {
                // Drop columns if they exist
                if (Schema::hasColumn('users', 'is_writer')) {
                    $table->dropColumn('is_writer');
                }
                if (Schema::hasColumn('users', 'is_editor')) {
                    $table->dropColumn('is_editor');
                }
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
        // Re-add columns if rolling back
        if (!Schema::hasColumn('users', 'is_editor') || !Schema::hasColumn('users', 'is_writer')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'is_editor')) {
                    $table->boolean('is_editor')->default(false)->after('organization_id');
                }
                if (!Schema::hasColumn('users', 'is_writer')) {
                    $table->boolean('is_writer')->default(false)->after('is_editor');
                }
            });
        }
    }
};

