<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Region Model
 * 
 * Represents an Indian state/region.
 */
class Region extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'code',
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
     * Get the users (readers) in this region.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the categories assigned to this region.
     */
    public function categories()
    {
        return $this->belongsToMany(StoryCategory::class, 'category_regions', 'region_id', 'category_id')
            ->withTimestamps();
    }
}

