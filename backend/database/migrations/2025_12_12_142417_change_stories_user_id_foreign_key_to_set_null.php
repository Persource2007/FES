<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Change Stories User ID Foreign Key to SET NULL
 * 
 * Changes the foreign key constraint on stories.user_id from CASCADE to SET NULL
 * to prevent stories from being deleted when their author is deleted.
 * This preserves story data even when users are removed from the system.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if stories table exists
        if (!Schema::hasTable('stories')) {
            return;
        }

        // Drop existing foreign key constraint
        $driver = DB::getDriverName();
        
        if ($driver === 'pgsql') {
            // PostgreSQL: Find the actual constraint name first from system tables
            $constraint = DB::selectOne("
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = 'stories'::regclass 
                AND contype = 'f'
                AND pg_get_constraintdef(oid) LIKE '%user_id%'
                LIMIT 1
            ");
            
            if ($constraint && isset($constraint->conname)) {
                DB::statement("ALTER TABLE stories DROP CONSTRAINT IF EXISTS \"{$constraint->conname}\"");
            }
        } else {
            // MySQL: Try Laravel's default naming convention first
            Schema::table('stories', function (Blueprint $table) {
                try {
                    $table->dropForeign(['user_id']);
                } catch (\Exception $e) {
                    // Try alternative MySQL constraint name patterns
                    try {
                        DB::statement('ALTER TABLE stories DROP FOREIGN KEY stories_user_id_foreign');
                    } catch (\Exception $e2) {
                        \Log::warning('Could not drop existing foreign key constraint: ' . $e2->getMessage());
                    }
                }
            });
        }

        // Ensure user_id column is nullable
        Schema::table('stories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        // Add new foreign key with SET NULL on delete
        Schema::table('stories', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('stories')) {
            return;
        }

        Schema::table('stories', function (Blueprint $table) {
            // Drop the SET NULL foreign key
            $foreignKeys = DB::select("
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_schema = DATABASE() 
                AND table_name = 'stories' 
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name LIKE '%user_id%'
            ");
            
            foreach ($foreignKeys as $fk) {
                $table->dropForeign([$fk->constraint_name]);
            }
        });

        // Restore CASCADE foreign key (original behavior)
        Schema::table('stories', function (Blueprint $table) {
            // Make user_id NOT NULL if we're reverting (stories without users would be invalid)
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }
};
