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
     * Get the readers who have access to this category.
     */
    public function readers()
    {
        return $this->belongsToMany(User::class, 'reader_category_access', 'category_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Get the regions assigned to this category.
     */
    public function regions()
    {
        return $this->belongsToMany(Region::class, 'category_regions', 'category_id', 'region_id')
            ->withTimestamps();
    }
}

