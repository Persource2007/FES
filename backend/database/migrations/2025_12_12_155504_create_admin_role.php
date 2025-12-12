<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Create Admin Role Migration
 * 
 * Creates the "Admin" role and assigns appropriate permissions.
 * Admins can manage users, categories, view stories, post stories, and view activity.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        // Check if Admin role already exists
        $adminRole = DB::table('roles')
            ->where('role_name', 'Admin')
            ->first();

        if ($adminRole) {
            return; // Role already exists, skip
        }

        // Create Admin role
        $adminRoleId = DB::table('roles')->insertGetId([
            'role_name' => 'Admin',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Get permission IDs that Admins should have
        // Admins need: manage_users, manage_story_categories, view_stories, post_stories, view_activity
        $permissions = DB::table('permissions')
            ->whereIn('slug', [
                'manage_users',
                'manage_story_categories',
                'view_stories',
                'post_stories',
                'view_activity',
            ])
            ->pluck('id')
            ->toArray();

        // Assign permissions to Admin role
        if (!empty($permissions)) {
            $rolePermissions = [];
            $timestamp = Carbon::now();
            foreach ($permissions as $permissionId) {
                $rolePermissions[] = [
                    'role_id' => $adminRoleId,
                    'permission_id' => $permissionId,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }
            DB::table('role_permissions')->insert($rolePermissions);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        // Get Admin role ID
        $adminRole = DB::table('roles')
            ->where('role_name', 'Admin')
            ->first();

        if ($adminRole) {
            // Remove permissions
            DB::table('role_permissions')
                ->where('role_id', $adminRole->id)
                ->delete();

            // Delete Admin role
            DB::table('roles')
                ->where('id', $adminRole->id)
                ->delete();
        }
    }
};
