<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Users Table Migration
 * 
 * Creates the users table with PostgreSQL-optimized fields and indexes.
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
        if (Schema::hasTable('users')) {
            return; // Table already exists, skip migration
        }

        Schema::create('users', function (Blueprint $table) {
            // Primary key - bigIncrements creates BIGSERIAL in PostgreSQL
            $table->bigIncrements('id');
            
            // User information fields
            $table->string('name');
            $table->string('email')->unique(); // unique() already creates an index
            $table->string('password');
            
            // Timestamps with timezone support (PostgreSQL default)
            $table->timestamps();
            
            // Indexes for better query performance
            // Note: email already has unique index, so we only index created_at
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
