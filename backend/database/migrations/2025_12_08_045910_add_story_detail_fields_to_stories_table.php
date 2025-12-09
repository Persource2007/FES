<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add Story Detail Fields to Stories Table Migration
 * 
 * Adds fields for enhanced story display: photo, quote, facilitator, person details, subtitle, and description.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            // Photo URL for the person in the story
            $table->string('photo_url')->nullable()->after('title');
            
            // Quote from the person
            $table->text('quote')->nullable()->after('photo_url');
            
            // Person name (who the quote is from)
            $table->string('person_name')->nullable()->after('quote');
            
            // Person location
            $table->string('person_location')->nullable()->after('person_name');
            
            // Facilitator name
            $table->string('facilitator_name')->nullable()->after('person_location');
            
            // Facilitator organization
            $table->string('facilitator_organization')->nullable()->after('facilitator_name');
            
            // Subtitle for the story
            $table->string('subtitle')->nullable()->after('facilitator_organization');
            
            // Description (separate from content for the main story description)
            $table->text('description')->nullable()->after('subtitle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stories', function (Blueprint $table) {
            $table->dropColumn([
                'photo_url',
                'quote',
                'person_name',
                'person_location',
                'facilitator_name',
                'facilitator_organization',
                'subtitle',
                'description',
            ]);
        });
    }
};
