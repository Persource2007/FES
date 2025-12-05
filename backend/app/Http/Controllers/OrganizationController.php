<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Organization Management Controller
 * 
 * Handles organization CRUD operations for super admin.
 */
class OrganizationController extends Controller
{
    /**
     * Get all organizations
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            // Check if organizations table exists
            if (!DB::getSchemaBuilder()->hasTable('organizations')) {
                return $this->errorResponse(
                    'Organizations table does not exist. Please run the migration: php artisan migrate',
                    500
                );
            }

            // Get all organizations with their regions
            $organizations = DB::table('organizations')
                ->leftJoin('regions', 'organizations.region_id', '=', 'regions.id')
                ->select(
                    'organizations.id',
                    'organizations.name',
                    'organizations.region_id',
                    'regions.name as region_name',
                    'organizations.is_active',
                    'organizations.created_at',
                    'organizations.updated_at'
                )
                ->orderBy('organizations.created_at', 'desc')
                ->get();

            return $this->successResponse([
                'organizations' => $organizations,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching organizations', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $errorMessage = 'An error occurred while fetching organizations';
            if (strpos($e->getMessage(), "doesn't exist") !== false || 
                strpos($e->getMessage(), 'Base table or view not found') !== false) {
                $errorMessage = 'Organizations table does not exist. Please run the migration: php artisan migrate';
            } else {
                $errorMessage = $e->getMessage();
            }

            return $this->errorResponse($errorMessage, 500);
        }
    }

    /**
     * Create a new organization
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Check if organizations table exists
            if (!DB::getSchemaBuilder()->hasTable('organizations')) {
                return $this->errorResponse(
                    'Organizations table does not exist. Please run the migration: php artisan migrate',
                    500
                );
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'region_id' => 'required|integer|exists:regions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Create organization
            $organization = Organization::create([
                'name' => $request->name,
                'region_id' => (int) $request->region_id,
            ]);

            // Get organization with region
            $organizationWithRegion = DB::table('organizations')
                ->leftJoin('regions', 'organizations.region_id', '=', 'regions.id')
                ->where('organizations.id', $organization->id)
                ->select(
                    'organizations.id',
                    'organizations.name',
                    'organizations.region_id',
                    'regions.name as region_name',
                    'organizations.is_active',
                    'organizations.created_at',
                    'organizations.updated_at'
                )
                ->first();

            return $this->successResponse([
                'message' => 'Organization created successfully',
                'organization' => $organizationWithRegion,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating organization', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while creating organization',
                500
            );
        }
    }

    /**
     * Update an organization
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'region_id' => 'required|integer|exists:regions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Find organization
            $organization = Organization::find($id);
            if (!$organization) {
                return $this->errorResponse('Organization not found', 404);
            }

            // Update organization
            $organization->name = $request->name;
            $organization->region_id = $request->region_id;
            $organization->save();

            // Get updated organization with region
            $organizationWithRegion = DB::table('organizations')
                ->leftJoin('regions', 'organizations.region_id', '=', 'regions.id')
                ->where('organizations.id', $organization->id)
                ->select(
                    'organizations.id',
                    'organizations.name',
                    'organizations.region_id',
                    'regions.name as region_name',
                    'organizations.is_active',
                    'organizations.created_at',
                    'organizations.updated_at'
                )
                ->first();

            return $this->successResponse([
                'message' => 'Organization updated successfully',
                'organization' => $organizationWithRegion,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating organization', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating organization',
                500
            );
        }
    }

    /**
     * Toggle organization active status
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function toggleStatus(int $id): JsonResponse
    {
        try {
            // Find organization
            $organization = Organization::find($id);
            if (!$organization) {
                return $this->errorResponse('Organization not found', 404);
            }

            // Toggle status
            $organization->is_active = !$organization->is_active;
            $organization->save();

            // Get updated organization with region
            $organizationWithRegion = DB::table('organizations')
                ->leftJoin('regions', 'organizations.region_id', '=', 'regions.id')
                ->where('organizations.id', $organization->id)
                ->select(
                    'organizations.id',
                    'organizations.name',
                    'organizations.region_id',
                    'regions.name as region_name',
                    'organizations.is_active',
                    'organizations.created_at',
                    'organizations.updated_at'
                )
                ->first();

            return $this->successResponse([
                'message' => 'Organization status updated successfully',
                'organization' => $organizationWithRegion,
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling organization status', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating organization status',
                500
            );
        }
    }

    /**
     * Delete an organization
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            // Find organization
            $organization = Organization::find($id);
            if (!$organization) {
                return $this->errorResponse('Organization not found', 404);
            }

            // Check if organization has users (if organization_id column exists)
            try {
                $userCount = DB::table('users')
                    ->where('organization_id', $id)
                    ->count();

                if ($userCount > 0) {
                    return $this->errorResponse(
                        'Cannot delete organization. It has associated users. Please remove or reassign users first.',
                        400
                    );
                }
            } catch (\Exception $e) {
                // Column might not exist yet, ignore the check
                // This allows deletion even if organization_id hasn't been added to users table
            }

            // Delete organization
            $organization->delete();

            return $this->successResponse([
                'message' => 'Organization deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting organization', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while deleting organization',
                500
            );
        }
    }
}

