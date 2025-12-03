<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * Region Controller
 * 
 * Handles region-related operations.
 */
class RegionController extends Controller
{
    /**
     * Get all regions (Indian states)
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $regions = Region::where('is_active', true)
                ->orderBy('name', 'asc')
                ->get();

            return $this->successResponse([
                'regions' => $regions,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching regions', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching regions',
                500
            );
        }
    }
}

