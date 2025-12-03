<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Category Regions Table Migration
 * 
 * Creates the many-to-many relationship between story categories and regions.
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
        if (Schema::hasTable('category_regions')) {
            return; // Table already exists, skip migration
        }

        Schema::create('category_regions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('region_id');
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('category_id')->references('id')->on('story_categories')->onDelete('cascade');
            $table->foreign('region_id')->references('id')->on('regions')->onDelete('cascade');
            
            // Unique constraint - a category can only be assigned to a region once
            $table->unique(['category_id', 'region_id']);
            
            // Indexes for performance
            $table->index('category_id');
            $table->index('region_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('category_regions');
    }
};

