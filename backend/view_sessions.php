<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== Sessions Table Data ===\n\n";

try {
    $sessions = DB::table('sessions')
        ->select('id', 'user_id', 'expires_at', 'created_at', 'updated_at')
        ->orderBy('created_at', 'desc')
        ->get();

    if ($sessions->isEmpty()) {
        echo "No sessions found in the database.\n";
    } else {
        echo "Total sessions: " . $sessions->count() . "\n\n";
        
        foreach ($sessions as $session) {
            $now = Carbon::now();
            $expiresAt = Carbon::parse($session->expires_at);
            $isExpired = $expiresAt->isPast();
            $timeUntilExpiry = $now->diffForHumans($expiresAt, true);
            
            echo "Session ID: " . substr($session->id, 0, 20) . "...\n";
            echo "User ID: {$session->user_id}\n";
            echo "Created: {$session->created_at}\n";
            echo "Updated: {$session->updated_at}\n";
            echo "Expires: {$session->expires_at}\n";
            echo "Status: " . ($isExpired ? "EXPIRED" : "ACTIVE") . "\n";
            if (!$isExpired) {
                echo "Time until expiry: {$timeUntilExpiry}\n";
            } else {
                $timeSinceExpiry = $now->diffForHumans($expiresAt);
                echo "Expired: {$timeSinceExpiry}\n";
            }
            
            // Get user info
            $user = DB::table('users')->where('id', $session->user_id)->first();
            if ($user) {
                echo "User: {$user->name} ({$user->email})\n";
                $role = DB::table('roles')->where('id', $user->role_id)->first();
                if ($role) {
                    echo "Role: {$role->role_name}\n";
                }
            }
            
            echo str_repeat("-", 60) . "\n\n";
        }
        
        // Summary
        $activeSessions = $sessions->filter(function ($session) {
            return Carbon::parse($session->expires_at)->isFuture();
        });
        $expiredSessions = $sessions->filter(function ($session) {
            return Carbon::parse($session->expires_at)->isPast();
        });
        
        echo "\n=== Summary ===\n";
        echo "Active sessions: " . $activeSessions->count() . "\n";
        echo "Expired sessions: " . $expiredSessions->count() . "\n";
        
        if ($expiredSessions->count() > 0) {
            echo "\nNote: Expired sessions should be cleaned up. They remain in the database until manually deleted.\n";
        }
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

