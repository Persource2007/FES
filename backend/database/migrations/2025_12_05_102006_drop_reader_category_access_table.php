<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop reader_category_access Table Migration
 * 
 * Removes the reader_category_access table as category access is now managed
 * through the category_organizations table. Writers get access to categories
 * assigned to their organization automatically.
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
        if (Schema::hasTable('reader_category_access')) {
            Schema::dropIfExists('reader_category_access');
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
        if (!Schema::hasTable('reader_category_access')) {
            Schema::create('reader_category_access', function (Blueprint $table) {
                $table->bigIncrements('id');
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('category_id');
                $table->timestamps();
                
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('category_id')->references('id')->on('story_categories')->onDelete('cascade');
                
                $table->unique(['user_id', 'category_id']);
                
                $table->index('user_id');
                $table->index('category_id');
            });
        }
    }
};
