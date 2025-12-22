<?php

namespace App\Http\Controllers;

use App\Helpers\PermissionHelper;
use App\Helpers\SlugHelper;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

/**
 * Story Management Controller
 * 
 * Handles story submission, review, and publishing.
 */
class StoryController extends Controller
{
    /**
     * Get base select fields for stories
     * Conditionally includes new location fields if columns exist
     * 
     * @return array
     */
    private function getStorySelectFields($includeUserFields = true, $includeCategoryFields = true): array
    {
        $fields = [
            'stories.id',
            'stories.title',
            'stories.subtitle',
            'stories.photo_url',
            'stories.quote',
            'stories.person_name',
            'stories.person_location',
            'stories.facilitator_name',
            'stories.facilitator_organization',
            'stories.description',
            'stories.content',
            'stories.status',
            'stories.created_at',
        ];
        
        // Add slug if column exists
        if (Schema::hasColumn('stories', 'slug')) {
            $fields[] = 'stories.slug';
        }
        
        // Add published_at if column exists
        if (Schema::hasColumn('stories', 'published_at')) {
            $fields[] = 'stories.published_at';
        }
        
        // Add approved_at if column exists
        if (Schema::hasColumn('stories', 'approved_at')) {
            $fields[] = 'stories.approved_at';
        }
        
        // Add approved_by if column exists
        if (Schema::hasColumn('stories', 'approved_by')) {
            $fields[] = 'stories.approved_by';
        }
        
        // Add new location fields if columns exist
        if (Schema::hasColumn('stories', 'state_id')) {
            $fields = array_merge($fields, [
                'stories.state_id',
                'stories.state_name',
                'stories.district_id',
                'stories.district_name',
                'stories.sub_district_id',
                'stories.sub_district_name',
                'stories.block_id',
                'stories.block_name',
                'stories.panchayat_id',
                'stories.panchayat_name',
                'stories.village_id',
                'stories.village_name',
            ]);
        }
        
        // Add latitude and longitude if columns exist
        if (Schema::hasColumn('stories', 'latitude')) {
            $fields[] = 'stories.latitude';
        }
        if (Schema::hasColumn('stories', 'longitude')) {
            $fields[] = 'stories.longitude';
        }
        
        // Add user fields if requested
        if ($includeUserFields) {
            $fields = array_merge($fields, [
                'users.id as user_id',
                'users.name as author_name',
                'users.email as author_email',
            ]);
        }
        
        // Add category fields if requested
        if ($includeCategoryFields) {
            $fields = array_merge($fields, [
                'story_categories.id as category_id',
                'story_categories.name as category_name',
            ]);
        }
        
        return $fields;
    }
    /**
     * Get all published stories (Public endpoint)
     * 
     * @return JsonResponse
     */
    public function getPublishedStories(): JsonResponse
    {
        try {
            $stories = DB::table('stories')
                ->leftJoin('users', 'stories.user_id', '=', 'users.id') // Use leftJoin to include stories with deleted authors
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.status', 'published')
                ->select($this->getStorySelectFields())
                ->orderBy('stories.published_at', 'desc')
                ->orderBy('stories.created_at', 'desc') // Fallback for NULL published_at
                ->get();

            return $this->successResponse([
                'stories' => $stories,
                'count' => count($stories),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching published stories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching stories',
                500
            );
        }
    }

    /**
     * Get a single published story by slug (Public endpoint)
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function getPublishedStoryBySlug(string $slug): JsonResponse
    {
        try {
            $story = DB::table('stories')
                ->leftJoin('users', 'stories.user_id', '=', 'users.id') // Use leftJoin to include stories with deleted authors
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.slug', $slug)
                ->where('stories.status', 'published')
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.slug',
                    'stories.subtitle',
                    'stories.photo_url',
                    'stories.quote',
                    'stories.person_name',
                    'stories.person_location',
                    'stories.facilitator_name',
                    'stories.facilitator_organization',
                    'stories.state_id',
                    'stories.state_name',
                    'stories.district_id',
                    'stories.district_name',
                    'stories.sub_district_id',
                    'stories.sub_district_name',
                    'stories.block_id',
                    'stories.block_name',
                    'stories.panchayat_id',
                    'stories.panchayat_name',
                    'stories.village_id',
                    'stories.village_name',
                    'stories.latitude',
                    'stories.longitude',
                    'stories.description',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'stories.published_at',
                    'users.name as author_name',
                    'story_categories.id as category_id',
                    'story_categories.name as category_name'
                )
                ->first();

            if (!$story) {
                return $this->errorResponse('Published story not found', 404);
            }

            return $this->successResponse([
                'story' => $story,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching single published story by slug', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching the story',
                500
            );
        }
    }

    /**
     * Get a single published story by ID (Public endpoint - for backward compatibility)
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function getPublishedStory(int $id): JsonResponse
    {
        try {
            $story = DB::table('stories')
                ->leftJoin('users', 'stories.user_id', '=', 'users.id') // Use leftJoin to include stories with deleted authors
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.id', $id)
                ->where('stories.status', 'published')
                ->select($this->getStorySelectFields())
                ->first();

            if (!$story) {
                return $this->errorResponse('Published story not found', 404);
            }

            return $this->successResponse([
                'story' => $story,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching single published story', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching the story',
                500
            );
        }
    }

    /**
     * Get pending stories for review (Super admin or Editor)
     * Editors only see stories from writers in their organization
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getPendingStories(Request $request): JsonResponse
    {
        try {
            // Get user making the request
            $userId = $request->input('user_id');
            $user = $userId ? User::find($userId) : null;

            $query = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.status', 'pending');

            // If user is Editor, filter by organization
            if ($user) {
                $userRole = DB::table('roles')
                    ->where('id', $user->role_id)
                    ->first();

                if ($userRole && $userRole->role_name === 'Editor' && $user->organization_id) {
                    // Editor can only see stories from writers in their organization
                    $query->where('users.organization_id', $user->organization_id);
                    
                    // Also ensure the author is a Writer
                    $writerRoleId = DB::table('roles')
                        ->where('role_name', 'Writer')
                        ->value('id');
                    
                    if ($writerRoleId) {
                        $query->where('users.role_id', $writerRoleId);
                    }
                }
            }

            $stories = $query->select($this->getStorySelectFields())
                ->orderBy('stories.created_at', 'desc')
                ->get();

            return $this->successResponse([
                'stories' => $stories,
                'count' => count($stories),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pending stories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching pending stories',
                500
            );
        }
    }

    /**
     * Get count of pending stories (for notification badge)
     * Editors only see count of stories from writers in their organization
     * 
     * @return JsonResponse
     */
    public function getPendingCount(): JsonResponse
    {
        try {
            // Get user making the request from query parameter
            $request = app('request');
            $userId = $request->input('user_id');
            $user = $userId ? User::find($userId) : null;

            $query = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->where('stories.status', 'pending');

            // If user is Editor, filter by organization
            if ($user) {
                $userRole = DB::table('roles')
                    ->where('id', $user->role_id)
                    ->first();

                if ($userRole && $userRole->role_name === 'Editor' && $user->organization_id) {
                    // Editor can only see stories from writers in their organization
                    $query->where('users.organization_id', $user->organization_id);
                    
                    // Also ensure the author is a Writer
                    $writerRoleId = DB::table('roles')
                        ->where('role_name', 'Writer')
                        ->value('id');
                    
                    if ($writerRoleId) {
                        $query->where('users.role_id', $writerRoleId);
                    }
                }
            }

            $count = $query->count();

            return $this->successResponse([
                'count' => $count,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pending stories count', [
                'message' => $e->getMessage(),
            ]);

            return $this->successResponse([
                'count' => 0,
            ]);
        }
    }

    /**
     * Create a new story (Available to all users)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'category_id' => 'required|integer|exists:story_categories,id',
                'title' => 'required|string|max:255',
                'subtitle' => 'nullable|string|max:255',
                'photo_url' => 'nullable|string|max:500',
                'quote' => 'nullable|string',
                'person_name' => 'nullable|string|max:255',
                'person_location' => 'nullable|string|max:255',
                'facilitator_name' => 'nullable|string|max:255',
                'facilitator_organization' => 'nullable|string|max:255',
                'state_id' => 'required|string|max:255',
                'state_name' => 'nullable|string|max:255',
                'district_id' => 'nullable|string|max:255',
                'district_name' => 'nullable|string|max:255',
                'sub_district_id' => 'nullable|string|max:255',
                'sub_district_name' => 'nullable|string|max:255',
                'block_id' => 'nullable|string|max:255',
                'block_name' => 'nullable|string|max:255',
                'panchayat_id' => 'nullable|string|max:255',
                'panchayat_name' => 'nullable|string|max:255',
                'village_id' => 'nullable|string|max:255',
                'village_name' => 'nullable|string|max:255',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'description' => 'nullable|string',
                'content' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Get authenticated user (you'll need to implement authentication middleware)
            // For now, we'll get user_id from request
            $userId = $request->input('user_id');
            if (!$userId) {
                return $this->errorResponse('User ID is required', 400);
            }

            $user = User::find($userId);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            // Check if user can post stories
            // Temporarily disabled - all users currently have all permissions
            // if (!PermissionHelper::canPostStories($user)) {
            //     return $this->errorResponse('You do not have permission to post stories', 403);
            // }

            // Verify user is a Writer (only Writers can create stories)
            // Temporarily disabled - all users can now create stories
            // $userRole = DB::table('roles')
            //     ->where('id', $user->role_id)
            //     ->first();

            // if (!$userRole || $userRole->role_name !== 'Writer') {
            //     return $this->errorResponse('Only Writers can create stories', 403);
            // }

            // Super admins have access to all categories
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            $isSuperAdmin = $user->role_id == $superAdminRoleId;

            // Check if user has access to this category via organization
            // Temporarily disabled - all users currently have access to all categories
            // $hasCategoryAccess = false;
            // if ($user->organization_id) {
            //     // Check if category is assigned to user's organization
            //     $hasCategoryAccess = DB::table('category_organizations')
            //         ->where('category_id', $request->category_id)
            //         ->where('organization_id', $user->organization_id)
            //         ->exists();
            // }

            // if (!$isSuperAdmin && !$hasCategoryAccess) {
            //     return $this->errorResponse('You do not have access to post in this category', 403);
            // }

            // Verify category is active
            $category = DB::table('story_categories')
                ->where('id', $request->category_id)
                ->where('is_active', true)
                ->first();

            if (!$category) {
                return $this->errorResponse('Category not found or inactive', 404);
            }

            // Generate unique slug from title
            $slug = SlugHelper::generateUniqueSlug($request->title);

            // Create story with pending status
            $story = Story::create([
                'user_id' => $userId,
                'category_id' => $request->category_id,
                'title' => $request->title,
                'slug' => $slug,
                'subtitle' => $request->input('subtitle'),
                'photo_url' => $request->input('photo_url'),
                'quote' => $request->input('quote'),
                'person_name' => $request->input('person_name'),
                'person_location' => $request->input('person_location'),
                'facilitator_name' => $request->input('facilitator_name'),
                'facilitator_organization' => $request->input('facilitator_organization'),
                'state_id' => $request->input('state_id'),
                'state_name' => $request->input('state_name') ?: null,
                'district_id' => $request->input('district_id') ?: null,
                'district_name' => $request->input('district_name') ?: null,
                'sub_district_id' => $request->input('sub_district_id') ?: null,
                'sub_district_name' => $request->input('sub_district_name') ?: null,
                'block_id' => $request->input('block_id') ?: null,
                'block_name' => $request->input('block_name') ?: null,
                'panchayat_id' => $request->input('panchayat_id') ?: null,
                'panchayat_name' => $request->input('panchayat_name') ?: null,
                'village_id' => $request->input('village_id') ?: null,
                'village_name' => $request->input('village_name') ?: null,
                'latitude' => $request->input('latitude') ?: null,
                'longitude' => $request->input('longitude') ?: null,
                'description' => $request->input('description'),
                'content' => $request->content,
                'status' => 'pending',
            ]);

            // Get story with relations
            $storyWithDetails = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.id', $story->id)
                ->select($this->getStorySelectFields())
                ->first();

            return $this->successResponse([
                'message' => 'Story submitted successfully. It will be reviewed by an administrator.',
                'story' => $storyWithDetails,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating story', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            return $this->errorResponse(
                'An error occurred while creating story: ' . $e->getMessage(),
                500
            );
        }
    }

    /**
     * Approve and publish a story (Super admin or Editor from same organization)
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        try {
            $story = Story::find($id);
            if (!$story) {
                return $this->errorResponse('Story not found', 404);
            }

            if ($story->status !== 'pending') {
                return $this->errorResponse('Story is not pending approval', 400);
            }

            // Get authenticated admin/editor user
            $adminUserId = $request->input('admin_user_id');
            if (!$adminUserId) {
                return $this->errorResponse('Admin user ID is required', 400);
            }

            $adminUser = User::find($adminUserId);
            if (!$adminUser) {
                return $this->errorResponse('Admin user not found', 404);
            }

            // Get admin user's role
            $adminRole = DB::table('roles')
                ->where('id', $adminUser->role_id)
                ->first();

            // Check if user is Super admin
            $isSuperAdmin = $adminRole && $adminRole->role_name === 'Super admin';
            
            // Check if user is Editor
            $isEditor = $adminRole && $adminRole->role_name === 'Editor';

            // Super admin can approve any story
            if ($isSuperAdmin && PermissionHelper::canManageStoryCategories($adminUser)) {
                // Allow approval
            }
            // Editor can only approve stories from writers in their organization
            elseif ($isEditor && PermissionHelper::canManageStoryCategories($adminUser)) {
                // Get the story author
                $storyAuthor = User::find($story->user_id);
                if (!$storyAuthor) {
                    return $this->errorResponse('Story author not found', 404);
                }

                // Check if story author is in the same organization as the editor
                if ($storyAuthor->organization_id !== $adminUser->organization_id) {
                    return $this->errorResponse('You can only approve stories from writers in your organization', 403);
                }

                // Get author's role to ensure they are a Writer
                $authorRole = DB::table('roles')
                    ->where('id', $storyAuthor->role_id)
                    ->first();

                if (!$authorRole || $authorRole->role_name !== 'Writer') {
                    return $this->errorResponse('You can only approve stories from Writers', 403);
                }
            } else {
                return $this->errorResponse('You do not have permission to approve stories', 403);
            }

            // Update story status
            $timestamp = date('Y-m-d H:i:s');
            $story->status = 'published';
            $story->approved_by = $adminUserId;
            $story->approved_at = $timestamp;
            $story->published_at = $timestamp;
            $story->save();

            // Get updated story with relations
            $storyWithDetails = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.id', $story->id)
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.slug',
                    'stories.subtitle',
                    'stories.photo_url',
                    'stories.quote',
                    'stories.person_name',
                    'stories.person_location',
                    'stories.facilitator_name',
                    'stories.facilitator_organization',
                    'stories.description',
                    'stories.content',
                    'stories.status',
                    'stories.approved_at',
                    'stories.published_at',
                    'users.name as author_name',
                    'story_categories.name as category_name'
                )
                ->first();

            return $this->successResponse([
                'message' => 'Story approved and published successfully',
                'story' => $storyWithDetails,
            ]);
        } catch (\Exception $e) {
            Log::error('Error approving story', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while approving story',
                500
            );
        }
    }

    /**
     * Reject a story (Super admin or Editor from same organization)
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'rejection_reason' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            $story = Story::find($id);
            if (!$story) {
                return $this->errorResponse('Story not found', 404);
            }

            if ($story->status !== 'pending') {
                return $this->errorResponse('Story is not pending approval', 400);
            }

            // Get authenticated admin/editor user
            $adminUserId = $request->input('admin_user_id');
            if (!$adminUserId) {
                return $this->errorResponse('Admin user ID is required', 400);
            }

            $adminUser = User::find($adminUserId);
            if (!$adminUser) {
                return $this->errorResponse('Admin user not found', 404);
            }

            // Get admin user's role
            $adminRole = DB::table('roles')
                ->where('id', $adminUser->role_id)
                ->first();

            // Check if user is Super admin
            $isSuperAdmin = $adminRole && $adminRole->role_name === 'Super admin';
            
            // Check if user is Editor
            $isEditor = $adminRole && $adminRole->role_name === 'Editor';

            // Super admin can reject any story
            if ($isSuperAdmin && PermissionHelper::canManageStoryCategories($adminUser)) {
                // Allow rejection
            }
            // Editor can only reject stories from writers in their organization
            elseif ($isEditor && PermissionHelper::canManageStoryCategories($adminUser)) {
                // Get the story author
                $storyAuthor = User::find($story->user_id);
                if (!$storyAuthor) {
                    return $this->errorResponse('Story author not found', 404);
                }

                // Check if story author is in the same organization as the editor
                if ($storyAuthor->organization_id !== $adminUser->organization_id) {
                    return $this->errorResponse('You can only reject stories from writers in your organization', 403);
                }

                // Get author's role to ensure they are a Writer
                $authorRole = DB::table('roles')
                    ->where('id', $storyAuthor->role_id)
                    ->first();

                if (!$authorRole || $authorRole->role_name !== 'Writer') {
                    return $this->errorResponse('You can only reject stories from Writers', 403);
                }
            } else {
                return $this->errorResponse('You do not have permission to reject stories', 403);
            }

            // Update story status
            $story->status = 'rejected';
            $story->approved_by = $adminUserId;
            $story->approved_at = date('Y-m-d H:i:s');
            $story->rejection_reason = $request->input('rejection_reason');
            $story->save();

            return $this->successResponse([
                'message' => 'Story rejected successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error rejecting story', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while rejecting story',
                500
            );
        }
    }

    /**
     * Get stories for a writer (their own stories)
     * 
     * @param int $userId
     * @return JsonResponse
     */
    public function getWriterStories(int $userId): JsonResponse
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            $stories = DB::table('stories')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.user_id', $userId)
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'stories.published_at',
                    'stories.rejection_reason',
                    'story_categories.name as category_name'
                )
                ->orderBy('stories.created_at', 'desc')
                ->get();

            return $this->successResponse([
                'stories' => $stories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching reader stories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching stories',
                500
            );
        }
    }

    /**
     * Get stories approved by a specific admin
     * 
     * @param int $adminId
     * @return JsonResponse
     */
    public function getApprovedStories(int $adminId): JsonResponse
    {
        try {
            $admin = User::find($adminId);
            if (!$admin) {
                return $this->errorResponse('Admin user not found', 404);
            }

            // Check if user can manage story categories (super admin permission)
            if (!PermissionHelper::canManageStoryCategories($admin)) {
                return $this->errorResponse('You do not have permission to view approved stories', 403);
            }

            // Get admin's role
            $adminRole = DB::table('roles')
                ->where('id', $admin->role_id)
                ->first();

            $isSuperAdmin = $adminRole && $adminRole->role_name === 'Super admin';
            $isEditor = $adminRole && $adminRole->role_name === 'Editor';

            $query = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.approved_by', $adminId)
                ->where('stories.status', 'published');

            // If Editor, filter by organization
            if ($isEditor && $admin->organization_id) {
                // Editor can only see stories from writers in their organization
                $query->where('users.organization_id', $admin->organization_id);
                
                // Also ensure the author is a Writer
                $writerRoleId = DB::table('roles')
                    ->where('role_name', 'Writer')
                    ->value('id');
                
                if ($writerRoleId) {
                    $query->where('users.role_id', $writerRoleId);
                }
            }

            $stories = $query->select($this->getStorySelectFields())
                ->orderBy('stories.published_at', 'desc')
                ->get();

            return $this->successResponse([
                'stories' => $stories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching approved stories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching approved stories',
                500
            );
        }
    }

    /**
     * Get all approved stories
     * Super admin sees all stories, Editors only see stories from writers in their organization
     * 
     * @return JsonResponse
     */
    public function getAllApprovedStories(): JsonResponse
    {
        try {
            // Get user making the request from query parameter
            $request = app('request');
            $userId = $request->input('user_id');
            $user = $userId ? User::find($userId) : null;

            $query = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->leftJoin('users as approvers', 'stories.approved_by', '=', 'approvers.id')
                ->where('stories.status', 'published')
                ->whereNotNull('stories.approved_by');

            // If user is Editor, filter by organization
            if ($user) {
                $userRole = DB::table('roles')
                    ->where('id', $user->role_id)
                    ->first();

                if ($userRole && $userRole->role_name === 'Editor' && $user->organization_id) {
                    // Editor can only see stories from writers in their organization
                    $query->where('users.organization_id', $user->organization_id);
                    
                    // Also ensure the author is a Writer
                    $writerRoleId = DB::table('roles')
                        ->where('role_name', 'Writer')
                        ->value('id');
                    
                    if ($writerRoleId) {
                        $query->where('users.role_id', $writerRoleId);
                    }
                }
            }

            // Build select array - check if new location columns exist
            $selectFields = [
                    'stories.id',
                    'stories.title',
                    'stories.subtitle',
                    'stories.photo_url',
                    'stories.quote',
                    'stories.person_name',
                    'stories.person_location',
                    'stories.facilitator_name',
                    'stories.facilitator_organization',
                    'stories.description',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'stories.published_at',
                    'stories.approved_at',
                    'stories.approved_by',
                    'users.id as user_id',
                    'users.name as author_name',
                    'users.email as author_email',
                    'story_categories.id as category_id',
                    'story_categories.name as category_name',
                    'approvers.name as approver_name',
                    'approvers.email as approver_email'
                ];
            
            // Add new location fields if columns exist
            $hasLocationColumns = Schema::hasColumn('stories', 'state_id');
            if ($hasLocationColumns) {
                $selectFields = array_merge($selectFields, [
                    'stories.state_id',
                    'stories.state_name',
                    'stories.district_id',
                    'stories.district_name',
                    'stories.sub_district_id',
                    'stories.sub_district_name',
                    'stories.block_id',
                    'stories.block_name',
                    'stories.panchayat_id',
                    'stories.panchayat_name',
                    'stories.village_id',
                    'stories.village_name',
                ]);
            }
            
            // Add latitude and longitude if columns exist
            if (Schema::hasColumn('stories', 'latitude')) {
                $selectFields[] = 'stories.latitude';
            }
            if (Schema::hasColumn('stories', 'longitude')) {
                $selectFields[] = 'stories.longitude';
            }
            
            $stories = $query->select($selectFields)
                ->orderBy('stories.published_at', 'desc')
                ->get();

            return $this->successResponse([
                'stories' => $stories,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching all approved stories', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching approved stories',
                500
            );
        }
    }

    /**
     * Update a story (Super admin or Editor)
     * Editors can only edit stories from writers in their organization
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $story = Story::find($id);
            if (!$story) {
                return $this->errorResponse('Story not found', 404);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'subtitle' => 'sometimes|nullable|string|max:255',
                'photo_url' => 'sometimes|nullable|string|max:500',
                'quote' => 'sometimes|nullable|string',
                'person_name' => 'sometimes|nullable|string|max:255',
                'person_location' => 'sometimes|nullable|string|max:255',
                'facilitator_name' => 'sometimes|nullable|string|max:255',
                'facilitator_organization' => 'sometimes|nullable|string|max:255',
                'state_id' => 'sometimes|required|string|max:255',
                'state_name' => 'sometimes|nullable|string|max:255',
                'district_id' => 'sometimes|nullable|string|max:255',
                'district_name' => 'sometimes|nullable|string|max:255',
                'sub_district_id' => 'sometimes|nullable|string|max:255',
                'sub_district_name' => 'sometimes|nullable|string|max:255',
                'block_id' => 'sometimes|nullable|string|max:255',
                'block_name' => 'sometimes|nullable|string|max:255',
                'panchayat_id' => 'sometimes|nullable|string|max:255',
                'panchayat_name' => 'sometimes|nullable|string|max:255',
                'village_id' => 'sometimes|nullable|string|max:255',
                'village_name' => 'sometimes|nullable|string|max:255',
                'latitude' => 'sometimes|nullable|numeric|between:-90,90',
                'longitude' => 'sometimes|nullable|numeric|between:-180,180',
                'description' => 'sometimes|nullable|string',
                'content' => 'sometimes|string',
                'category_id' => 'sometimes|integer|exists:story_categories,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Get authenticated admin/editor user
            $adminUserId = $request->input('admin_user_id');
            if (!$adminUserId) {
                return $this->errorResponse('Admin user ID is required', 400);
            }

            $adminUser = User::find($adminUserId);
            if (!$adminUser) {
                return $this->errorResponse('Admin user not found', 404);
            }

            // Get admin user's role
            $adminRole = DB::table('roles')
                ->where('id', $adminUser->role_id)
                ->first();

            // Check if user is Super admin
            $isSuperAdmin = $adminRole && $adminRole->role_name === 'Super admin';
            
            // Check if user is Editor
            $isEditor = $adminRole && $adminRole->role_name === 'Editor';

            // Check permissions
            if (!PermissionHelper::canManageStoryCategories($adminUser)) {
                return $this->errorResponse('You do not have permission to edit stories', 403);
            }

            // If Editor, check if story is from their organization
            if ($isEditor) {
                $storyAuthor = User::find($story->user_id);
                if (!$storyAuthor) {
                    return $this->errorResponse('Story author not found', 404);
                }

                // Check if story author is in the same organization as the editor
                if ($storyAuthor->organization_id !== $adminUser->organization_id) {
                    return $this->errorResponse('You can only edit stories from writers in your organization', 403);
                }

                // Get author's role to ensure they are a Writer
                $authorRole = DB::table('roles')
                    ->where('id', $storyAuthor->role_id)
                    ->first();

                if (!$authorRole || $authorRole->role_name !== 'Writer') {
                    return $this->errorResponse('You can only edit stories from Writers', 403);
                }
            }

            // Allow editing published or pending stories
            if ($story->status !== 'published' && $story->status !== 'pending') {
                return $this->errorResponse('Only published or pending stories can be edited', 400);
            }

            // Update story
            if ($request->has('title')) {
                $story->title = $request->title;
                // Regenerate slug if title changed
                $story->slug = SlugHelper::generateUniqueSlug($request->title, $story->id);
            }
            if ($request->has('subtitle')) {
                $story->subtitle = $request->subtitle ?: null;
            }
            if ($request->has('photo_url')) {
                $story->photo_url = $request->photo_url ?: null;
            }
            if ($request->has('quote')) {
                $story->quote = $request->quote ?: null;
            }
            if ($request->has('person_name')) {
                $story->person_name = $request->person_name ?: null;
            }
            if ($request->has('person_location')) {
                $story->person_location = $request->person_location ?: null;
            }
            if ($request->has('facilitator_name')) {
                $story->facilitator_name = $request->facilitator_name ?: null;
            }
            if ($request->has('facilitator_organization')) {
                $story->facilitator_organization = $request->facilitator_organization ?: null;
            }
            if ($request->has('state_id')) {
                $story->state_id = $request->state_id;
            }
            if ($request->has('state_name')) {
                $story->state_name = $request->state_name ?: null;
            }
            if ($request->has('district_id')) {
                $story->district_id = $request->district_id ?: null;
            }
            if ($request->has('district_name')) {
                $story->district_name = $request->district_name ?: null;
            }
            if ($request->has('sub_district_id')) {
                $story->sub_district_id = $request->sub_district_id ?: null;
            }
            if ($request->has('sub_district_name')) {
                $story->sub_district_name = $request->sub_district_name ?: null;
            }
            if ($request->has('block_id')) {
                $story->block_id = $request->block_id ?: null;
            }
            if ($request->has('block_name')) {
                $story->block_name = $request->block_name ?: null;
            }
            if ($request->has('panchayat_id')) {
                $story->panchayat_id = $request->panchayat_id ?: null;
            }
            if ($request->has('panchayat_name')) {
                $story->panchayat_name = $request->panchayat_name ?: null;
            }
            if ($request->has('village_id')) {
                $story->village_id = $request->village_id ?: null;
            }
            if ($request->has('village_name')) {
                $story->village_name = $request->village_name ?: null;
            }
            if ($request->has('latitude')) {
                $story->latitude = $request->latitude ?: null;
            }
            if ($request->has('longitude')) {
                $story->longitude = $request->longitude ?: null;
            }
            if ($request->has('description')) {
                $story->description = $request->description ?: null;
            }
            if ($request->has('content')) {
                $story->content = $request->content;
            }
            if ($request->has('category_id')) {
                $story->category_id = $request->category_id;
            }
            if ($request->has('status')) {
                // Allow changing status to pending (unpublish) or back to published
                $newStatus = $request->status;
                if ($newStatus === 'pending' || $newStatus === 'published') {
                    $story->status = $newStatus;
                    // If unpublishing (status = pending), clear published_at
                    if ($newStatus === 'pending') {
                        $story->published_at = null;
                    } elseif ($newStatus === 'published' && !$story->published_at) {
                        // If republishing and no published_at, set it
                        $story->published_at = date('Y-m-d H:i:s');
                    }
                }
            }
            $story->save();

            // Get updated story with relations
            $storyWithDetails = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.id', $story->id)
                ->select($this->getStorySelectFields())
                ->first();

            return $this->successResponse([
                'message' => 'Story updated successfully',
                'story' => $storyWithDetails,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating story', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating story',
                500
            );
        }
    }

    /**
     * Delete a story (Super admin only)
     * 
     * IMPORTANT: This is the ONLY way stories can be deleted in the system.
     * Stories are protected from automatic deletion:
     * - Foreign key on user_id uses SET NULL (stories preserved when authors are deleted)
     * - Foreign key on category_id uses RESTRICT (categories with stories cannot be deleted)
     * - Stories can only be removed through this explicit admin action
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $story = Story::find($id);
            if (!$story) {
                return $this->errorResponse('Story not found', 404);
            }

            // Get authenticated admin user
            $adminUserId = $request->input('admin_user_id');
            if (!$adminUserId) {
                return $this->errorResponse('Admin user ID is required', 400);
            }

            $adminUser = User::find($adminUserId);
            if (!$adminUser) {
                return $this->errorResponse('Admin user not found', 404);
            }

            // Check if user can manage story categories
            if (!PermissionHelper::canManageStoryCategories($adminUser)) {
                return $this->errorResponse('You do not have permission to delete stories', 403);
            }

            // Only allow deleting published stories
            if ($story->status !== 'published') {
                return $this->errorResponse('Only published stories can be deleted', 400);
            }

            $storyTitle = $story->title;
            $story->delete();

            return $this->successResponse([
                'message' => 'Story deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting story', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while deleting story',
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

