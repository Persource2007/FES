<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Sessions Table Migration
 * 
 * Creates the sessions table for storing user OAuth sessions with encrypted tokens.
 * This is part of the BFF (Backend for Frontend) implementation.
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
        if (Schema::hasTable('sessions')) {
            return; // Table already exists, skip migration
        }

        Schema::create('sessions', function (Blueprint $table) {
            // Primary key - session ID (40 characters for security)
            $table->string('id', 40)->primary();
            
            // Foreign key to users table
            $table->unsignedBigInteger('user_id');
            
            // Encrypted OAuth tokens (never exposed to browser)
            $table->text('oauth_access_token'); // Encrypted
            $table->text('oauth_refresh_token')->nullable(); // Encrypted, nullable
            
            // Session expiration timestamp
            $table->timestamp('expires_at');
            
            // Timestamps
            $table->timestamps();
            
            // Foreign key constraint
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes for better query performance
            $table->index('user_id');
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};

