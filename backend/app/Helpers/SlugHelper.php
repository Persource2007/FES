<?php

namespace App\Helpers;

/**
 * Slug Helper
 * 
 * Utility functions for generating URL-friendly slugs.
 */
class SlugHelper
{
    /**
     * Generate a URL-friendly slug from a string
     * 
     * @param string $text The text to convert to a slug
     * @return string The slug
     */
    public static function generateSlug(string $text): string
    {
        if (empty($text)) {
            return '';
        }

        // Convert to lowercase
        $slug = strtolower($text);
        
        // Replace spaces with hyphens
        $slug = preg_replace('/\s+/', '-', $slug);
        
        // Remove all non-word characters except hyphens
        $slug = preg_replace('/[^\w\-]+/', '', $slug);
        
        // Replace multiple hyphens with single hyphen
        $slug = preg_replace('/\-+/', '-', $slug);
        
        // Trim hyphens from start and end
        $slug = trim($slug, '-');
        
        return $slug;
    }

    /**
     * Generate a unique slug by appending a number if needed
     * 
     * @param string $text The text to convert to a slug
     * @param int|null $excludeId Story ID to exclude from uniqueness check
     * @return string The unique slug
     */
    public static function generateUniqueSlug(string $text, ?int $excludeId = null): string
    {
        $baseSlug = self::generateSlug($text);
        $slug = $baseSlug;
        $counter = 1;

        // Check if slug exists (excluding current story if updating)
        while (self::slugExists($slug, $excludeId)) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if a slug already exists in the database
     * 
     * @param string $slug The slug to check
     * @param int|null $excludeId Story ID to exclude from check
     * @return bool True if slug exists
     */
    private static function slugExists(string $slug, ?int $excludeId = null): bool
    {
        $query = \Illuminate\Support\Facades\DB::table('stories')
            ->where('slug', $slug);

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}

