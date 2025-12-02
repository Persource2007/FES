<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Health Check Controller
 * 
 * Provides health check endpoint to verify database connectivity
 * and application status.
 */
class HealthController extends Controller
{
    /**
     * Health check endpoint
     * 
     * Verifies PostgreSQL connection and returns database status.
     * 
     * @return JsonResponse
     */
    public function check(): JsonResponse
    {
        try {
            // Test database connection
            DB::connection()->getPdo();

            // Get user count
            $userCount = User::count();

            // Get database name from config
            $databaseName = config('database.connections.pgsql.database', 'FES_Stories');

            return response()->json([
                'success' => true,
                'message' => 'Database connection successful',
                'user_count' => $userCount,
                'database' => $databaseName,
                'timestamp' => (new \DateTime())->format('c'),
            ], 200);
        } catch (\PDOException $e) {
            Log::error('Database connection failed', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage(),
                'user_count' => 0,
                'database' => config('database.connections.pgsql.database', 'FES_Stories'),
                'timestamp' => (new \DateTime())->format('c'),
                'error' => [
                    'code' => $e->getCode(),
                    'message' => $e->getMessage(),
                ],
            ], 500);
        } catch (\Exception $e) {
            Log::error('Health check error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Health check failed: ' . $e->getMessage(),
                'user_count' => 0,
                'database' => config('database.connections.pgsql.database', 'FES_Stories'),
                'timestamp' => (new \DateTime())->format('c'),
                'error' => [
                    'message' => $e->getMessage(),
                ],
            ], 500);
        }
    }
}

