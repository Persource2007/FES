<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * ReaderCategoryAccess Model
 * 
 * Represents the many-to-many relationship between readers and story categories.
 */
class ReaderCategoryAccess extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'reader_category_access';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'category_id',
    ];

    /**
     * Get the user (reader) that has access.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the category that the reader has access to.
     */
    public function category()
    {
        return $this->belongsTo(StoryCategory::class, 'category_id');
    }
}

