<?php

namespace App\Helpers;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Permission Helper
 * 
 * Utility class for checking user permissions.
 */
class PermissionHelper
{
    /**
     * Check if a user has a specific permission.
     * 
     * @param User|null $user
     * @param string $permissionSlug
     * @return bool
     */
    public static function hasPermission(?User $user, string $permissionSlug): bool
    {
        if (!$user || !$user->role_id) {
            return false;
        }

        return DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('role_permissions.role_id', $user->role_id)
            ->where('permissions.slug', $permissionSlug)
            ->exists();
    }

    /**
     * Check if a user has any of the given permissions.
     * 
     * @param User|null $user
     * @param array $permissionSlugs
     * @return bool
     */
    public static function hasAnyPermission(?User $user, array $permissionSlugs): bool
    {
        if (!$user || !$user->role_id || empty($permissionSlugs)) {
            return false;
        }

        return DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('role_permissions.role_id', $user->role_id)
            ->whereIn('permissions.slug', $permissionSlugs)
            ->exists();
    }

    /**
     * Check if a user has all of the given permissions.
     * 
     * @param User|null $user
     * @param array $permissionSlugs
     * @return bool
     */
    public static function hasAllPermissions(?User $user, array $permissionSlugs): bool
    {
        if (!$user || !$user->role_id || empty($permissionSlugs)) {
            return false;
        }

        $count = DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('role_permissions.role_id', $user->role_id)
            ->whereIn('permissions.slug', $permissionSlugs)
            ->count();

        return $count === count($permissionSlugs);
    }

    /**
     * Get all permission slugs for a user.
     * 
     * @param User|null $user
     * @return array
     */
    public static function getUserPermissions(?User $user): array
    {
        if (!$user || !$user->role_id) {
            return [];
        }

        return DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('role_permissions.role_id', $user->role_id)
            ->pluck('permissions.slug')
            ->toArray();
    }

    /**
     * Check if a user can manage users (typically super admin only).
     * 
     * @param User|null $user
     * @return bool
     */
    public static function canManageUsers(?User $user): bool
    {
        return self::hasPermission($user, 'manage_users');
    }

    /**
     * Check if a user can manage story categories.
     * 
     * @param User|null $user
     * @return bool
     */
    public static function canManageStoryCategories(?User $user): bool
    {
        return self::hasPermission($user, 'manage_story_categories');
    }

    /**
     * Check if a user can manage reader access.
     * 
     * @param User|null $user
     * @return bool
     */
    public static function canManageReaderAccess(?User $user): bool
    {
        return self::hasPermission($user, 'manage_reader_access');
    }

    /**
     * Check if a user can post stories.
     * 
     * @param User|null $user
     * @return bool
     */
    public static function canPostStories(?User $user): bool
    {
        return self::hasPermission($user, 'post_stories');
    }

    /**
     * Check if a user can view stories.
     * 
     * @param User|null $user
     * @return bool
     */
    public static function canViewStories(?User $user): bool
    {
        return self::hasPermission($user, 'view_stories');
    }
}

