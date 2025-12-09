<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Populate State and City for Existing Stories Migration
 * 
 * Populates state field for existing stories from their author's organization's region.
 * City is left null as it wasn't previously tracked.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update stories with state from user's organization's region
        // Using PostgreSQL-compatible syntax
        DB::statement("
            UPDATE stories
            SET state = (
                SELECT regions.name
                FROM users
                INNER JOIN organizations ON users.organization_id = organizations.id
                INNER JOIN regions ON organizations.region_id = regions.id
                WHERE users.id = stories.user_id
                LIMIT 1
            )
            WHERE stories.state IS NULL
            AND EXISTS (
                SELECT 1
                FROM users
                INNER JOIN organizations ON users.organization_id = organizations.id
                INNER JOIN regions ON organizations.region_id = regions.id
                WHERE users.id = stories.user_id
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear state and city for all stories
        DB::table('stories')->update([
            'state' => null,
            'city' => null,
        ]);
    }
};
