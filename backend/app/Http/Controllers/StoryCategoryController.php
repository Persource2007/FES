<?php

namespace App\Http\Controllers;

use App\Helpers\PermissionHelper;
use App\Models\StoryCategory;
use App\Models\User;
use App\Models\Region;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Story Category Management Controller
 * 
 * Handles story category CRUD operations and reader access management for super admin.
 */
class StoryCategoryController extends Controller
{
    /**
     * Get all story categories
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $categories = StoryCategory::with('regions')->orderBy('name', 'asc')->get();

            return $this->successResponse([
                'categories' => $categories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching story categories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching story categories',
                500
            );
        }
    }

    /**
     * Create a new story category
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:story_categories,name',
                'description' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'region_ids' => 'nullable|array',
                'region_ids.*' => 'exists:regions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Create category
            $category = StoryCategory::create([
                'name' => $request->name,
                'description' => $request->description ?? null,
                'is_active' => $request->is_active ?? true,
            ]);

            // Assign regions if provided
            if ($request->has('region_ids') && is_array($request->region_ids)) {
                $category->regions()->sync($request->region_ids);
                
                // Automatically grant access to all readers in assigned regions
                $this->syncRegionBasedAccess($category);
            }

            // Load regions relationship
            $category->load('regions');

            return $this->successResponse([
                'message' => 'Story category created successfully',
                'category' => $category,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating story category', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            // Return more specific error message
            $errorMessage = 'An error occurred while creating story category';
            if (strpos($e->getMessage(), 'duplicate key') !== false) {
                $errorMessage = 'A category with this name already exists';
            } elseif (strpos($e->getMessage(), 'relation') !== false || strpos($e->getMessage(), 'table') !== false) {
                $errorMessage = 'Database error: Please ensure the story_categories table exists';
            }

            return $this->errorResponse($errorMessage . ': ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a story category
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            // Find category
            $category = StoryCategory::find($id);
            if (!$category) {
                return $this->errorResponse('Story category not found', 404);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:story_categories,name,' . $id,
                'description' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'region_ids' => 'nullable|array',
                'region_ids.*' => 'exists:regions,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Update category
            $category->name = $request->name;
            $category->description = $request->description ?? null;
            if ($request->has('is_active')) {
                $category->is_active = $request->is_active;
            }
            $category->save();

            // Update regions if provided
            if ($request->has('region_ids')) {
                $regionIds = is_array($request->region_ids) ? $request->region_ids : [];
                $category->regions()->sync($regionIds);
                
                // Automatically grant access to all readers in assigned regions
                $this->syncRegionBasedAccess($category);
            }

            // Load regions relationship
            $category->load('regions');

            return $this->successResponse([
                'message' => 'Story category updated successfully',
                'category' => $category,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating story category', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating story category',
                500
            );
        }
    }

    /**
     * Toggle category active status
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function toggleStatus(int $id): JsonResponse
    {
        try {
            // Find category
            $category = StoryCategory::find($id);
            if (!$category) {
                return $this->errorResponse('Story category not found', 404);
            }

            // Toggle status
            $category->is_active = !$category->is_active;
            $category->save();

            // Load regions relationship
            $category->load('regions');

            return $this->successResponse([
                'message' => 'Category status updated successfully',
                'category' => $category,
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling category status', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating category status',
                500
            );
        }
    }

    /**
     * Delete a story category
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            // Find category
            $category = StoryCategory::find($id);
            if (!$category) {
                return $this->errorResponse('Story category not found', 404);
            }

            // Delete category (cascade will handle reader_category_access)
            $category->delete();

            return $this->successResponse([
                'message' => 'Story category deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting story category', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while deleting story category',
                500
            );
        }
    }

    /**
     * Get categories accessible by a specific reader
     * 
     * @param int $userId
     * @return JsonResponse
     */
    public function getReaderCategories(int $userId): JsonResponse
    {
        try {
            // Verify user exists and can post stories
            $user = User::find($userId);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            // Check if user is super admin - super admins don't need category access restrictions
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            if ($user->role_id == $superAdminRoleId) {
                return $this->errorResponse('Super admins have access to all categories', 403);
            }

            // Check if user has permission to post stories
            if (!PermissionHelper::canPostStories($user)) {
                return $this->errorResponse('User does not have permission to post stories', 403);
            }

            // Get categories accessible by this reader
            // Include categories from:
            // 1. Direct access (reader_category_access table)
            // 2. Region-based access (category_regions table matching user's region)
            $userRegionId = $user->region_id;
            
            $categories = DB::table('story_categories')
                ->where('story_categories.is_active', true)
                ->where(function ($query) use ($userId, $userRegionId) {
                    // Direct access
                    $query->whereExists(function ($subQuery) use ($userId) {
                        $subQuery->select(DB::raw(1))
                            ->from('reader_category_access')
                            ->whereColumn('reader_category_access.category_id', 'story_categories.id')
                            ->where('reader_category_access.user_id', $userId);
                    });
                    
                    // Region-based access
                    if ($userRegionId) {
                        $query->orWhereExists(function ($subQuery) use ($userRegionId) {
                            $subQuery->select(DB::raw(1))
                                ->from('category_regions')
                                ->whereColumn('category_regions.category_id', 'story_categories.id')
                                ->where('category_regions.region_id', $userRegionId);
                        });
                    }
                })
                ->select(
                    'story_categories.id',
                    'story_categories.name',
                    'story_categories.description',
                    'story_categories.is_active',
                    'story_categories.created_at',
                    'story_categories.updated_at'
                )
                ->distinct()
                ->orderBy('story_categories.name', 'asc')
                ->get();

            return $this->successResponse([
                'categories' => $categories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching reader categories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching reader categories',
                500
            );
        }
    }

    /**
     * Update reader access to categories
     * 
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function updateReaderAccess(Request $request, int $userId): JsonResponse
    {
        try {
            // Ensure category_ids is always an array (default to empty if not provided)
            $categoryIds = $request->input('category_ids', []);
            if (!is_array($categoryIds)) {
                $categoryIds = [];
            }

            // Validate category IDs if array is not empty
            if (!empty($categoryIds)) {
                foreach ($categoryIds as $categoryId) {
                    if (!is_numeric($categoryId) || !DB::table('story_categories')->where('id', $categoryId)->exists()) {
                        return $this->errorResponse('Invalid category ID: ' . $categoryId, 400);
                    }
                }
            }

            // Verify user exists and can post stories
            $user = User::find($userId);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            // Check if user is super admin - cannot modify super admin access
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            if ($superAdminRoleId && $user->role_id == $superAdminRoleId) {
                return $this->errorResponse('Cannot modify Super admin category access', 403);
            }

            // Check if user has permission to post stories
            if (!PermissionHelper::canPostStories($user)) {
                return $this->errorResponse('User does not have permission to post stories', 403);
            }

            // Remove existing access
            DB::table('reader_category_access')
                ->where('user_id', $userId)
                ->delete();

            // Add new access (if any categories selected)
            if (!empty($categoryIds)) {
                $accessData = [];
                $timestamp = date('Y-m-d H:i:s');
                foreach ($categoryIds as $categoryId) {
                    $accessData[] = [
                        'user_id' => $userId,
                        'category_id' => $categoryId,
                        'created_at' => $timestamp,
                        'updated_at' => $timestamp,
                    ];
                }
                DB::table('reader_category_access')->insert($accessData);
            }

            // Get updated categories
            $categories = DB::table('story_categories')
                ->join('reader_category_access', 'story_categories.id', '=', 'reader_category_access.category_id')
                ->where('reader_category_access.user_id', $userId)
                ->select(
                    'story_categories.id',
                    'story_categories.name',
                    'story_categories.description',
                    'story_categories.is_active',
                    'story_categories.created_at',
                    'story_categories.updated_at'
                )
                ->orderBy('story_categories.name', 'asc')
                ->get();

            return $this->successResponse([
                'message' => 'Reader access updated successfully',
                'categories' => $categories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating reader access', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating reader access',
                500
            );
        }
    }

    /**
     * Get all readers with their category access
     * 
     * @return JsonResponse
     */
    public function getReadersWithAccess(): JsonResponse
    {
        try {
            // Get super admin role ID to exclude them
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            // Get all users who have permission to post stories, EXCLUDING super admins
            $readersQuery = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('permissions.slug', 'post_stories')
                ->select('users.id', 'users.name', 'users.email')
                ->distinct();

            // Exclude super admins if super admin role exists
            if ($superAdminRoleId) {
                $readersQuery->where('users.role_id', '!=', $superAdminRoleId);
            }

            $readers = $readersQuery->orderBy('users.name', 'asc')->get();

            // Get category access for each reader
            foreach ($readers as $reader) {
                $reader->categories = DB::table('reader_category_access')
                    ->join('story_categories', 'reader_category_access.category_id', '=', 'story_categories.id')
                    ->where('reader_category_access.user_id', $reader->id)
                    ->select(
                        'story_categories.id',
                        'story_categories.name',
                        'story_categories.description'
                    )
                    ->get();
            }

            return $this->successResponse([
                'readers' => $readers,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching readers with access', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching readers with access',
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
    /**
     * Sync region-based access for a category
     * Automatically grants access to all readers in assigned regions
     * 
     * @param StoryCategory $category
     * @return void
     */
    private function syncRegionBasedAccess(StoryCategory $category): void
    {
        // Get all regions assigned to this category
        $regionIds = $category->regions()->pluck('regions.id')->toArray();
        
        if (empty($regionIds)) {
            return;
        }

        // Get super admin role ID (super admins don't need category access)
        $superAdminRoleId = DB::table('roles')
            ->where('role_name', 'Super admin')
            ->value('id');

        // Get all readers in these regions who can post stories
        $readers = DB::table('users')
            ->whereIn('region_id', $regionIds)
            ->where('role_id', '!=', $superAdminRoleId)
            ->whereNotNull('region_id')
            ->pluck('id')
            ->toArray();

        if (empty($readers)) {
            return;
        }

        // Get readers who can post stories (check permissions)
        $readersWithPermission = [];
        foreach ($readers as $readerId) {
            $reader = User::find($readerId);
            if ($reader && PermissionHelper::canPostStories($reader)) {
                $readersWithPermission[] = $readerId;
            }
        }

        if (empty($readersWithPermission)) {
            return;
        }

        // Grant access to these readers (insert only if not exists)
        $timestamp = date('Y-m-d H:i:s');
        $accessData = [];
        foreach ($readersWithPermission as $readerId) {
            // Check if access already exists
            $exists = DB::table('reader_category_access')
                ->where('user_id', $readerId)
                ->where('category_id', $category->id)
                ->exists();

            if (!$exists) {
                $accessData[] = [
                    'user_id' => $readerId,
                    'category_id' => $category->id,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            }
        }

        if (!empty($accessData)) {
            DB::table('reader_category_access')->insert($accessData);
        }
    }

    protected function errorResponse(string $message, int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $statusCode);
    }
}

