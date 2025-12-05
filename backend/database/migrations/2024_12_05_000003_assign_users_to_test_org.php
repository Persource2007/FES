<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Assign Users to Test ORG 1 Migration
 * 
 * Creates "Test ORG 1" organization and assigns all existing users to it.
 * Also sets user region_id from the organization's region_id.
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
        // Check if organizations table exists
        if (!Schema::hasTable('organizations')) {
            return; // Organizations table doesn't exist yet, skip
        }

        // Check if users table exists
        if (!Schema::hasTable('users')) {
            return; // Users table doesn't exist yet, skip
        }

        // Check if organization_id column exists in users table
        if (!Schema::hasColumn('users', 'organization_id')) {
            return; // Column doesn't exist yet, skip
        }

        // Get the first region (or create a default one if none exists)
        $firstRegion = DB::table('regions')
            ->where('is_active', true)
            ->orderBy('id', 'asc')
            ->first();

        if (!$firstRegion) {
            // If no regions exist, we can't create the organization
            // This migration will need to be run after regions are seeded
            return;
        }

        // Create "Test ORG 1" organization if it doesn't exist
        $testOrg = DB::table('organizations')
            ->where('name', 'Test ORG 1')
            ->first();

        if (!$testOrg) {
            $timestamp = Carbon::now();
            $orgId = DB::table('organizations')->insertGetId([
                'name' => 'Test ORG 1',
                'region_id' => $firstRegion->id,
                'is_active' => true,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        } else {
            $orgId = $testOrg->id;
        }

        // Get the organization's region_id
        $orgRegionId = DB::table('organizations')
            ->where('id', $orgId)
            ->value('region_id');

        // Assign all existing users to Test ORG 1
        // Also update their region_id to match the organization's region
        $updateTimestamp = Carbon::now();
        DB::table('users')
            ->whereNull('organization_id')
            ->update([
                'organization_id' => $orgId,
                'region_id' => $orgRegionId, // Set region from organization
                'updated_at' => $updateTimestamp,
            ]);

        // Also update users who already have organization_id but want to ensure consistency
        // (This is optional, but ensures all users have the correct region from their org)
        $usersWithOrgs = DB::table('users')
            ->whereNotNull('organization_id')
            ->get();

        foreach ($usersWithOrgs as $user) {
            $userOrgRegionId = DB::table('organizations')
                ->where('id', $user->organization_id)
                ->value('region_id');

            if ($userOrgRegionId) {
                $userUpdateTimestamp = Carbon::now();
                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'region_id' => $userOrgRegionId,
                        'updated_at' => $userUpdateTimestamp,
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        // Optionally remove organization assignments
        // But we'll keep them for data integrity
        // DB::table('users')->update(['organization_id' => null]);
    }
};

