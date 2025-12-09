<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Remove State and City Columns from Stories Table Migration
 * 
 * Removes state and city fields from stories table as they are replaced
 * by hierarchical location fields (state_name, district_name, etc.).
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn(['state', 'city']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('state')->nullable()->after('facilitator_organization');
            $table->string('city')->nullable()->after('state');
        });
    }
};
