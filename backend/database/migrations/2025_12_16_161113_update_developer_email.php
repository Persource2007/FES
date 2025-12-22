<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Update Developer Email Migration
 * 
 * Updates the email for the developer user (id: 14) from "developer@example.com" to "developer@fes.org.in"
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('users')
            ->where('id', 14)
            ->where('email', 'developer@example.com')
            ->update(['email' => 'developer@fes.org.in']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('users')
            ->where('id', 14)
            ->where('email', 'developer@fes.org.in')
            ->update(['email' => 'developer@example.com']);
    }
};
