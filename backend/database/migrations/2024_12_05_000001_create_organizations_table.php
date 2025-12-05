<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create Organizations Table Migration
 * 
 * Creates the organizations table with name and region_id fields.
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
        if (Schema::hasTable('organizations')) {
            return; // Table already exists, skip migration
        }

        Schema::create('organizations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 255);
            $table->unsignedBigInteger('region_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Foreign key constraint
            $table->foreign('region_id')
                ->references('id')
                ->on('regions')
                ->onDelete('restrict')
                ->onUpdate('cascade');
            
            // Indexes
            $table->index('region_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};

