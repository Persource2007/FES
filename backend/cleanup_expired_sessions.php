<?php

/**
 * Cleanup Expired Sessions Script
 * 
 * This script removes expired sessions from the sessions table.
 * Can be run manually or via cron job.
 * 
 * Usage: php cleanup_expired_sessions.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== Cleaning Up Expired Sessions ===\n\n";

try {
    $now = Carbon::now();
    
    // Count expired sessions before deletion
    $expiredCount = DB::table('sessions')
        ->where('expires_at', '<', $now)
        ->count();
    
    if ($expiredCount === 0) {
        echo "No expired sessions found. Database is clean.\n";
        exit(0);
    }
    
    echo "Found {$expiredCount} expired session(s).\n";
    echo "Deleting expired sessions...\n\n";
    
    // Get details of sessions to be deleted (for logging)
    $expiredSessions = DB::table('sessions')
        ->select('id', 'user_id', 'expires_at', 'created_at')
        ->where('expires_at', '<', $now)
        ->get();
    
    // Show what will be deleted
    foreach ($expiredSessions as $session) {
        $user = DB::table('users')->where('id', $session->user_id)->first();
        $userInfo = $user ? "{$user->name} ({$user->email})" : "User ID: {$session->user_id}";
        $expiredAt = Carbon::parse($session->expires_at);
        $timeAgo = $now->diffForHumans($expiredAt);
        
        echo "  - Session: " . substr($session->id, 0, 20) . "... | User: {$userInfo} | Expired: {$timeAgo}\n";
    }
    
    // Delete expired sessions
    $deleted = DB::table('sessions')
        ->where('expires_at', '<', $now)
        ->delete();
    
    echo "\n✓ Successfully deleted {$deleted} expired session(s).\n";
    
    // Show remaining sessions
    $remainingCount = DB::table('sessions')->count();
    $activeCount = DB::table('sessions')
        ->where('expires_at', '>=', $now)
        ->count();
    
    echo "\n=== Summary ===\n";
    echo "Deleted: {$deleted} expired session(s)\n";
    echo "Remaining: {$remainingCount} total session(s)\n";
    echo "Active: {$activeCount} session(s)\n";
    
    exit(0);
} catch (\Exception $e) {
    echo "ERROR: Failed to cleanup expired sessions\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    exit(1);
}

