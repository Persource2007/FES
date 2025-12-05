<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Organization Model
 * 
 * Represents an organization in the system.
 */
class Organization extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'region_id',
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
     * Get the region that belongs to this organization.
     */
    public function region()
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    /**
     * Get the users (writers) in this organization.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'organization_id');
    }

    /**
     * Get the categories assigned to this organization.
     */
    public function categories()
    {
        return $this->belongsToMany(StoryCategory::class, 'category_organizations', 'organization_id', 'category_id')
            ->withTimestamps();
    }
}

