<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Activity Controller
 * 
 * Handles activity logging and retrieval.
 * Users can only see their own activities.
 */
class ActivityController extends Controller
{
    /**
     * Get activities for the current user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Validate user_id is provided
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $userId = $request->input('user_id');

            // Get activities for this user only, ordered by most recent first
            $activities = Activity::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->limit(50) // Limit to last 50 activities
                ->get()
                ->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'type' => $activity->type,
                        'message' => $activity->message,
                        'metadata' => $activity->metadata ?? [],
                        'timestamp' => $activity->created_at ? $activity->created_at->toISOString() : null,
                    ];
                });

            return $this->successResponse([
                'activities' => $activities,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching activities', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching activities',
                500
            );
        }
    }

    /**
     * Create a new activity log entry
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer|exists:users,id',
                'type' => 'required|string|max:50',
                'message' => 'required|string',
                'metadata' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Create activity
            // Note: Activity model has timestamps disabled, so we manually set created_at
            $activity = Activity::create([
                'user_id' => $request->user_id,
                'type' => $request->type,
                'message' => $request->message,
                'metadata' => $request->metadata ?? [],
                'created_at' => \Carbon\Carbon::now(),
            ]);

            return $this->successResponse([
                'message' => 'Activity logged successfully',
                'activity' => [
                    'id' => $activity->id,
                    'type' => $activity->type,
                    'message' => $activity->message,
                    'metadata' => $activity->metadata,
                    'timestamp' => $activity->created_at ? $activity->created_at->toISOString() : null,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating activity', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while logging activity',
                500
            );
        }
    }

    /**
     * Return a success JSON response
     * 
     * @param array $data Response data
     * @param int $statusCode HTTP status code
     * @return JsonResponse
     */
    protected function successResponse(array $data, int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            ...$data,
        ], $statusCode);
    }

    /**
     * Return an error JSON response
     * 
     * @param string $message Error message
     * @param int $statusCode HTTP status code
     * @return JsonResponse
     */
    protected function errorResponse(string $message, int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $statusCode);
    }
}

