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
 * Handles story category CRUD operations and writer access management for super admin.
 */
class StoryCategoryController extends Controller
{
    /**
     * Get all story categories
     * Editors can only see categories for their organization's region
     * Super admins can see all categories
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            // Get user making the request from query parameter
            $request = app('request');
            $userId = $request->input('user_id');
            $user = $userId ? User::find($userId) : null;

            $query = StoryCategory::with('organizations');

            // If user is Editor, filter by organization
            if ($user) {
                $userRole = DB::table('roles')
                    ->where('id', $user->role_id)
                    ->first();

                $isSuperAdmin = $userRole && $userRole->role_name === 'Super admin';
                $isEditor = $userRole && $userRole->role_name === 'Editor';

                if ($isEditor && $user->organization_id) {
                    // Only show categories assigned to this organization
                    $query->whereHas('organizations', function ($q) use ($user) {
                        $q->where('organizations.id', $user->organization_id);
                    });
                }
                // Super admins see all categories (no filtering)
            }

            $categories = $query->orderBy('name', 'asc')->get();

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
     * Editors can only create categories for their organization's region
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Get user making the request
            $userId = $request->input('user_id');
            $user = $userId ? User::find($userId) : null;

            // Check if user is Editor
            $isEditor = false;
            $userOrganization = null;
            if ($user) {
                $userRole = DB::table('roles')
                    ->where('id', $user->role_id)
                    ->first();
                $isEditor = $userRole && $userRole->role_name === 'Editor';

                if ($isEditor && $user->organization_id) {
                    $userOrganization = DB::table('organizations')
                        ->where('id', $user->organization_id)
                        ->first();
                }
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:story_categories,name',
                'description' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'organization_ids' => 'nullable|array',
                'organization_ids.*' => 'exists:organizations,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // For Editors, restrict to their organization
            $organizationIds = $request->has('organization_ids') && is_array($request->organization_ids) 
                ? $request->organization_ids 
                : [];

            if ($isEditor) {
                if (!$userOrganization) {
                    return $this->errorResponse('You must belong to an organization to create categories', 403);
                }

                // Force organization_ids to only include the editor's organization
                $organizationIds = [$userOrganization->id];
            }

            // Create category
            $category = StoryCategory::create([
                'name' => $request->name,
                'description' => $request->description ?? null,
                'is_active' => $request->is_active ?? true,
            ]);

            // Assign organizations
            if (!empty($organizationIds)) {
                $category->organizations()->sync($organizationIds);
                
                // Automatically grant access to all writers in assigned organizations
                $this->syncOrganizationBasedAccess($category);
            }

            // Load organizations relationship
            $category->load('organizations');

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

            // Get user making the request
            $userId = $request->input('user_id');
            $user = $userId ? User::find($userId) : null;

            // Check if user is Editor
            $isEditor = false;
            $userOrganization = null;
            if ($user) {
                $userRole = DB::table('roles')
                    ->where('id', $user->role_id)
                    ->first();
                $isEditor = $userRole && $userRole->role_name === 'Editor';

                if ($isEditor) {
                    if (!$user->organization_id) {
                        return $this->errorResponse('You must belong to an organization to edit categories', 403);
                    }

                    $userOrganization = DB::table('organizations')
                        ->where('id', $user->organization_id)
                        ->first();

                    if (!$userOrganization || !$userOrganization->region_id) {
                        return $this->errorResponse('Your organization must have a region to edit categories', 403);
                    }

                    // Check if category belongs to editor's organization
                    $categoryOrganizations = $category->organizations()->pluck('organizations.id')->toArray();
                    if (!in_array($userOrganization->id, $categoryOrganizations)) {
                        return $this->errorResponse('You can only edit categories from your organization', 403);
                    }
                }
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:story_categories,name,' . $id,
                'description' => 'nullable|string',
                'is_active' => 'nullable|boolean',
                'organization_ids' => 'nullable|array',
                'organization_ids.*' => 'exists:organizations,id',
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

            // Update organizations if provided
            // For Editors, prevent changing organization assignment
            if ($request->has('organization_ids')) {
                $organizationIds = is_array($request->organization_ids) ? $request->organization_ids : [];
                
                // For Editors, force organization to their organization
                if ($isEditor && $userOrganization) {
                    $organizationIds = [$userOrganization->id];
                }
                
                $category->organizations()->sync($organizationIds);
                
                // Automatically grant access to all writers in assigned organizations
                $this->syncOrganizationBasedAccess($category);
            }

            // Load organizations relationship
            $category->load('organizations');

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

            // Delete category (cascade will handle category_organizations and category_regions)
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
     * Get categories accessible by a specific writer
     * 
     * @param int $userId
     * @return JsonResponse
     */
    public function getWriterCategories(int $userId): JsonResponse
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

            // Get categories accessible by this writer
            // Writers can ONLY access categories explicitly assigned to their organization
            // This ensures strict organization-based access control
            
            if (!$user->organization_id) {
                // If user has no organization, they can't access any categories
                return $this->successResponse([
                    'categories' => [],
                ]);
            }
            
            // Get categories assigned to writer's organization ONLY
            $accessibleCategoryIds = DB::table('category_organizations')
                ->where('organization_id', $user->organization_id)
                ->pluck('category_id')
                ->toArray();

            // If no categories are accessible, return empty array
            if (empty($accessibleCategoryIds)) {
                return $this->successResponse([
                    'categories' => [],
                ]);
            }

            // Get the actual category details
            $categories = DB::table('story_categories')
                ->where('story_categories.is_active', true)
                ->whereIn('story_categories.id', $accessibleCategoryIds)
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
                'categories' => $categories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching writer categories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching writer categories',
                500
            );
        }
    }

    /**
     * Update writer access to categories
     * 
     * @param Request $request
     * @param int $userId
     * @return JsonResponse
     */
    public function updateWriterAccess(Request $request, int $userId): JsonResponse
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

            // Writer access is now managed through category_organizations table
            // Writers get access to categories assigned to their organization
            // This method is deprecated - use category_organizations instead
            
            if (!$user->organization_id) {
                return $this->errorResponse('User must belong to an organization to have category access', 400);
            }

            // Get categories assigned to user's organization
            $categories = DB::table('story_categories')
                ->join('category_organizations', 'story_categories.id', '=', 'category_organizations.category_id')
                ->where('category_organizations.organization_id', $user->organization_id)
                ->where('story_categories.is_active', true)
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
                'message' => 'Writer access is managed through organization assignments. Showing categories for user\'s organization.',
                'categories' => $categories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating writer access', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating writer access',
                500
            );
        }
    }

    /**
     * Get all writers with their category access
     * 
     * @return JsonResponse
     */
    public function getWritersWithAccess(): JsonResponse
    {
        try {
            // Get super admin role ID to exclude them
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            // Get all users who have permission to post stories, EXCLUDING super admins
            $writersQuery = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('permissions.slug', 'post_stories')
                ->select('users.id', 'users.name', 'users.email')
                ->distinct();

            // Exclude super admins if super admin role exists
            if ($superAdminRoleId) {
                $writersQuery->where('users.role_id', '!=', $superAdminRoleId);
            }

            $writers = $writersQuery->orderBy('users.name', 'asc')->get();

            // Get category access for each writer based on their organization
            foreach ($writers as $writer) {
                $writerObj = User::find($writer->id);
                if ($writerObj && $writerObj->organization_id) {
                    $writer->categories = DB::table('story_categories')
                        ->join('category_organizations', 'story_categories.id', '=', 'category_organizations.category_id')
                        ->where('category_organizations.organization_id', $writerObj->organization_id)
                        ->where('story_categories.is_active', true)
                        ->select(
                            'story_categories.id',
                            'story_categories.name',
                            'story_categories.description'
                        )
                        ->get();
                } else {
                    $writer->categories = [];
                }
            }

            return $this->successResponse([
                'writers' => $writers,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching writers with access', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching writers with access',
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
     * Automatically grants access to all writers in assigned regions
     * 
     * @param StoryCategory $category
     * @return void
     */
    /**
     * Sync organization-based access for a category
     * Grants access to all writers in assigned organizations
     */
    private function syncOrganizationBasedAccess(StoryCategory $category): void
    {
        // Get all organizations assigned to this category
        $organizationIds = $category->organizations()->pluck('organizations.id')->toArray();

        if (empty($organizationIds)) {
            return;
        }

        // Get all writers in these organizations who can post stories
        $superAdminRoleId = DB::table('roles')
            ->where('role_name', 'Super admin')
            ->value('id');

        $writers = DB::table('users')
            ->whereIn('organization_id', $organizationIds)
            ->where('role_id', '!=', $superAdminRoleId)
            ->whereNotNull('organization_id')
            ->pluck('id')
            ->toArray();

        if (empty($writers)) {
            return;
        }

        // Get writers who can post stories (check permissions)
        $writersWithPermission = [];
        foreach ($writers as $writerId) {
            $writer = User::find($writerId);
            if ($writer && PermissionHelper::canPostStories($writer)) {
                $writersWithPermission[] = $writerId;
            }
        }

        if (empty($writersWithPermission)) {
            return;
        }

        // Access is now managed through category_organizations table
        // Writers automatically get access to categories assigned to their organization
        // No need to populate reader_category_access table anymore
    }

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

        // Get all organizations in these regions
        $organizationIds = DB::table('organizations')
            ->whereIn('region_id', $regionIds)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        if (empty($organizationIds)) {
            return;
        }

        // Get all writers in these organizations who can post stories
        $writers = DB::table('users')
            ->whereIn('organization_id', $organizationIds)
            ->where('role_id', '!=', $superAdminRoleId)
            ->whereNotNull('organization_id')
            ->pluck('id')
            ->toArray();

        if (empty($writers)) {
            return;
        }

        // Get writers who can post stories (check permissions)
        $writersWithPermission = [];
        foreach ($writers as $writerId) {
            $writer = User::find($writerId);
            if ($writer && PermissionHelper::canPostStories($writer)) {
                $writersWithPermission[] = $writerId;
            }
        }

        if (empty($writersWithPermission)) {
            return;
        }

        // Access is now managed through category_organizations table
        // Writers automatically get access to categories assigned to their organization
        // No need to populate reader_category_access table anymore
    }

    protected function errorResponse(string $message, int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $statusCode);
    }
}

