<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rename Reader Role to Writer Migration
 * 
 * Renames the "Reader" role to "Writer" in the database.
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
        // Rename Reader role to Writer
        DB::table('roles')
            ->where('role_name', 'Reader')
            ->update(['role_name' => 'Writer']);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        // Rename Writer role back to Reader
        DB::table('roles')
            ->where('role_name', 'Writer')
            ->update(['role_name' => 'Reader']);
    }
};

