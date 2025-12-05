<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Drop User Organizations Pivot Table Migration
 * 
 * Removes the user_organizations pivot table to revert back to
 * one-to-many relationship (users.organization_id).
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
        if (Schema::hasTable('user_organizations')) {
            // Drop foreign key constraints first
            Schema::table('user_organizations', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->dropForeign(['organization_id']);
            });
            
            // Drop the table
            Schema::dropIfExists('user_organizations');
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        // Recreate the table if rolling back
        if (!Schema::hasTable('user_organizations')) {
            Schema::create('user_organizations', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('organization_id');
                $table->timestamps();
                
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
                
                $table->unique(['user_id', 'organization_id']);
                
                $table->index('user_id');
                $table->index('organization_id');
            });
        }
    }
};
