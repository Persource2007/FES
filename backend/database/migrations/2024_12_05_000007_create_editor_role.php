<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Create Editor Role Migration
 * 
 * Creates the "Editor" role and assigns appropriate permissions.
 * Editors can approve stories from writers in their organization and edit them.
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
        // Check if Editor role already exists
        $editorRole = DB::table('roles')
            ->where('role_name', 'Editor')
            ->first();

        if ($editorRole) {
            return; // Role already exists, skip
        }

        // Create Editor role
        $editorRoleId = DB::table('roles')->insertGetId([
            'role_name' => 'Editor',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Get permission IDs that Editors should have
        // Editors need: view_stories, post_stories (to edit), manage_story_categories (to approve)
        $permissions = DB::table('permissions')
            ->whereIn('slug', [
                'view_stories',
                'post_stories',
                'manage_story_categories',
            ])
            ->pluck('id')
            ->toArray();

        // Assign permissions to Editor role
        if (!empty($permissions)) {
            $rolePermissions = [];
            $timestamp = Carbon::now();
            foreach ($permissions as $permissionId) {
                $rolePermissions[] = [
                    'role_id' => $editorRoleId,
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
        // Get Editor role ID
        $editorRole = DB::table('roles')
            ->where('role_name', 'Editor')
            ->first();

        if ($editorRole) {
            // Remove permissions
            DB::table('role_permissions')
                ->where('role_id', $editorRole->id)
                ->delete();

            // Delete Editor role
            DB::table('roles')
                ->where('id', $editorRole->id)
                ->delete();
        }
    }
};

