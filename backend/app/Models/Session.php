<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Session Model
 * 
 * Represents a user session with encrypted OAuth tokens.
 * Part of the BFF (Backend for Frontend) implementation.
 */
class Session extends Model
{
    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'sessions';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id',
        'user_id',
        'oauth_access_token',
        'oauth_refresh_token',
        'expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user that owns this session.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Check if the session is expired.
     *
     * @return bool
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Decrypt and get the OAuth access token.
     *
     * @return string|null
     */
    public function getAccessToken(): ?string
    {
        try {
            return decrypt($this->oauth_access_token);
        } catch (\Exception $e) {
            \Log::error('Failed to decrypt access token', [
                'session_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Decrypt and get the OAuth refresh token.
     *
     * @return string|null
     */
    public function getRefreshToken(): ?string
    {
        if (!$this->oauth_refresh_token) {
            return null;
        }

        try {
            return decrypt($this->oauth_refresh_token);
        } catch (\Exception $e) {
            \Log::error('Failed to decrypt refresh token', [
                'session_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}

