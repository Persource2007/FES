<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Category Organizations Table Migration
 * 
 * Creates the category_organizations pivot table to link categories to organizations.
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
        if (Schema::hasTable('category_organizations')) {
            return; // Table already exists, skip migration
        }

        Schema::create('category_organizations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('organization_id');
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('category_id')
                ->references('id')
                ->on('story_categories')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            $table->foreign('organization_id')
                ->references('id')
                ->on('organizations')
                ->onDelete('cascade')
                ->onUpdate('cascade');
            
            // Unique constraint to prevent duplicate entries
            $table->unique(['category_id', 'organization_id']);
            
            // Indexes
            $table->index('category_id');
            $table->index('organization_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('category_organizations');
    }
};

