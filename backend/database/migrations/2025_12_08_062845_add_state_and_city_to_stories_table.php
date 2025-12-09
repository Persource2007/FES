<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add State and City Columns to Stories Table Migration
 * 
 * Adds state and city fields to stories table to allow admin to manually specify
 * the location for each story instead of defaulting to organization's region.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('state')->nullable()->after('facilitator_organization');
            $table->string('city')->nullable()->after('state');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn(['state', 'city']);
        });
    }
};
