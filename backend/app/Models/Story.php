<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Story Model
 * 
 * Represents a story submitted by a reader and reviewed by super admin.
 */
class Story extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'content',
        'status',
        'approved_by',
        'approved_at',
        'published_at',
        'rejection_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'approved_at' => 'datetime',
        'published_at' => 'datetime',
    ];

    /**
     * Get the user (author) that created this story.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the category this story belongs to.
     */
    public function category()
    {
        return $this->belongsTo(StoryCategory::class, 'category_id');
    }

    /**
     * Get the admin who approved this story.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}

