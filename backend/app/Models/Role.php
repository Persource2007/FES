<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Role Model
 * 
 * Represents a user role in the system.
 */
class Role extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'role_name',
    ];

    /**
     * Get the users that have this role.
     */
    public function users()
    {
        return $this->hasMany(User::class, 'role_id');
    }

    /**
     * Get the permissions for this role.
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions', 'role_id', 'permission_id')
            ->withTimestamps();
    }

    /**
     * Check if the role has a specific permission.
     * 
     * @param string $permissionSlug
     * @return bool
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->permissions()->where('slug', $permissionSlug)->exists();
    }

    /**
     * Get all permission slugs for this role.
     * 
     * @return array
     */
    public function getPermissionSlugs(): array
    {
        return $this->permissions()->pluck('slug')->toArray();
    }
}

