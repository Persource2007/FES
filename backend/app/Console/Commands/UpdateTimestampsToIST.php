<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Update Timestamps to IST Command
 * 
 * ⚠️  WARNING: This command converts UTC timestamps to IST.
 * 
 * This should ONLY be used if timestamps were incorrectly stored.
 * Standard practice is to keep timestamps in UTC in the database
 * and display them in IST on the frontend (which is already done).
 */
class UpdateTimestampsToIST extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'timestamps:update-to-ist 
                            {--dry-run : Show what would be updated without making changes}
                            {--table= : Specific table to update (stories, users, activities, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update existing timestamps from UTC to IST (Use with caution!)';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->warn('⚠️  WARNING: This will modify timestamps in your database!');
        $this->warn('⚠️  Standard practice is to keep timestamps in UTC.');
        $this->warn('⚠️  Frontend already displays timestamps in IST.');
        
        if (!$this->confirm('Are you sure you want to proceed?', false)) {
            $this->info('Operation cancelled.');
            return 0;
        }

        $dryRun = $this->option('dry-run');
        $table = $this->option('table') ?: 'all';

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $tables = $this->getTablesToUpdate($table);

        foreach ($tables as $tableName) {
            $this->updateTableTimestamps($tableName, $dryRun);
        }

        $this->info('✅ Timestamp update completed!');
        return 0;
    }

    /**
     * Get list of tables to update
     *
     * @param string $table
     * @return array
     */
    private function getTablesToUpdate($table)
    {
        $allTables = ['stories', 'users', 'activities', 'story_categories'];
        
        if ($table === 'all') {
            return $allTables;
        }

        if (in_array($table, $allTables)) {
            return [$table];
        }

        $this->error("Invalid table: {$table}");
        $this->info("Available tables: " . implode(', ', $allTables));
        return [];
    }

    /**
     * Update timestamps for a specific table
     *
     * @param string $tableName
     * @param bool $dryRun
     * @return void
     */
    private function updateTableTimestamps($tableName, $dryRun)
    {
        $this->info("\n📊 Processing table: {$tableName}");

        // Get timestamp columns for this table
        $timestampColumns = $this->getTimestampColumns($tableName);

        if (empty($timestampColumns)) {
            $this->warn("  No timestamp columns found in {$tableName}");
            return;
        }

        foreach ($timestampColumns as $column) {
            $this->updateColumn($tableName, $column, $dryRun);
        }
    }

    /**
     * Get timestamp columns for a table
     *
     * @param string $tableName
     * @return array
     */
    private function getTimestampColumns($tableName)
    {
        $columns = [
            'stories' => ['created_at', 'updated_at', 'published_at', 'approved_at'],
            'users' => ['created_at', 'updated_at'],
            'activities' => ['created_at'],
            'story_categories' => ['created_at', 'updated_at'],
        ];

        return $columns[$tableName] ?? [];
    }

    /**
     * Update a specific column
     *
     * @param string $tableName
     * @param string $column
     * @param bool $dryRun
     * @return void
     */
    private function updateColumn($tableName, $column, $dryRun)
    {
        // Count records that need updating
        $count = DB::table($tableName)
            ->whereNotNull($column)
            ->count();

        if ($count === 0) {
            $this->line("  ✓ {$column}: No records to update");
            return;
        }

        if ($dryRun) {
            // Show sample of what would be updated
            $samples = DB::table($tableName)
                ->whereNotNull($column)
                ->select('id', $column)
                ->limit(3)
                ->get();

            $this->line("  📝 {$column}: Would update {$count} records");
            foreach ($samples as $sample) {
                $oldValue = $sample->$column;
                $newValue = $this->convertToIST($oldValue);
                $this->line("     ID {$sample->id}: {$oldValue} → {$newValue}");
            }
        } else {
            // Perform the update
            DB::table($tableName)
                ->whereNotNull($column)
                ->update([
                    $column => DB::raw(
                        "({$column} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata'"
                    )
                ]);

            $this->line("  ✓ {$column}: Updated {$count} records");
        }
    }

    /**
     * Convert a timestamp to IST (for display purposes)
     *
     * @param string $timestamp
     * @return string
     */
    private function convertToIST($timestamp)
    {
        try {
            $date = new \DateTime($timestamp, new \DateTimeZone('UTC'));
            $date->setTimezone(new \DateTimeZone('Asia/Kolkata'));
            return $date->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            return $timestamp;
        }
    }
}

