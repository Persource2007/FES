<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * StoryCategory Model
 * 
 * Represents a story category that can be assigned to stories.
 */
class StoryCategory extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'story_categories';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the writers who have access to this category through their organization.
     * Writers get access via category_organizations table.
     * Note: This relationship is complex - use organizations() and then access users through organizations instead.
     */
    public function writers()
    {
        // Access writers through organizations assigned to this category
        // Use: $category->organizations()->with('users')->get() instead
        return $this->hasManyThrough(
            User::class,
            Organization::class,
            'id', // Foreign key on organizations table
            'organization_id', // Foreign key on users table
            'id', // Local key on story_categories table
            'id' // Local key on organizations table
        )->join('category_organizations', 'organizations.id', '=', 'category_organizations.organization_id')
         ->where('category_organizations.category_id', $this->id);
    }

    /**
     * Get the regions assigned to this category.
     */
    public function regions()
    {
        return $this->belongsToMany(Region::class, 'category_regions', 'category_id', 'region_id')
            ->withTimestamps();
    }

    /**
     * Get the organizations assigned to this category.
     */
    public function organizations()
    {
        return $this->belongsToMany(Organization::class, 'category_organizations', 'category_id', 'organization_id')
            ->withTimestamps();
    }
}

