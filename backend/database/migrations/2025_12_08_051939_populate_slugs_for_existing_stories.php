<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Helpers\SlugHelper;

/**
 * Populate Slugs for Existing Stories Migration
 * 
 * Generates and populates slugs for all existing stories that don't have one.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get all stories without slugs
        $stories = DB::table('stories')
            ->whereNull('slug')
            ->orWhere('slug', '')
            ->get();

        foreach ($stories as $story) {
            // Generate unique slug
            $slug = SlugHelper::generateUniqueSlug($story->title, $story->id);
            
            // Update the story with the slug
            DB::table('stories')
                ->where('id', $story->id)
                ->update(['slug' => $slug]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Optionally clear slugs (not recommended as it breaks URLs)
        // DB::table('stories')->update(['slug' => null]);
    }
};
