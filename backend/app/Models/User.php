<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * User Model
 * 
 * Represents a user in the system.
 */
class User extends Model implements AuthenticatableContract
{
    use Authenticatable, HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'role_id',
        'region_id',
        'organization_id',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    /**
     * Get the role that belongs to this user.
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get the region that belongs to this user.
     */
    public function region()
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    /**
     * Get the organization that belongs to this user.
     */
    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    /**
     * Get the user's region from their organization.
     * Falls back to direct region_id if organization doesn't exist.
     * 
     * @return Region|null
     */
    public function getRegionFromOrganization()
    {
        if ($this->organization && $this->organization->region_id) {
            return Region::find($this->organization->region_id);
        }
        
        return $this->region;
    }

    /**
     * Check if the user has a specific permission.
     * 
     * @param string $permissionSlug
     * @return bool
     */
    public function hasPermission(string $permissionSlug): bool
    {
        if (!$this->role) {
            return false;
        }

        return $this->role->hasPermission($permissionSlug);
    }

    /**
     * Get all permission slugs for this user.
     * 
     * @return array
     */
    public function getPermissionSlugs(): array
    {
        if (!$this->role) {
            return [];
        }

        return $this->role->getPermissionSlugs();
    }
}

