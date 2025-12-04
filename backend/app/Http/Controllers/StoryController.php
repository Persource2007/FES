<?php

namespace App\Http\Controllers;

use App\Helpers\PermissionHelper;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Story Management Controller
 * 
 * Handles story submission, review, and publishing.
 */
class StoryController extends Controller
{
    /**
     * Get all published stories (Public endpoint)
     * 
     * @return JsonResponse
     */
    public function getPublishedStories(): JsonResponse
    {
        try {
            $stories = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->leftJoin('category_regions', 'story_categories.id', '=', 'category_regions.category_id')
                ->leftJoin('regions', 'category_regions.region_id', '=', 'regions.id')
                ->where('stories.status', 'published')
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'stories.published_at',
                    'users.name as author_name',
                    'story_categories.id as category_id',
                    'story_categories.name as category_name',
                    'regions.id as region_id',
                    'regions.name as region_name',
                    'regions.code as region_code'
                )
                ->orderBy('stories.published_at', 'desc')
                ->get();

            // If a category has multiple regions, we'll get duplicate stories
            // Group by story ID and take the first region (or handle multiple regions if needed)
            $uniqueStories = [];
            foreach ($stories as $story) {
                $storyId = $story->id;
                if (!isset($uniqueStories[$storyId])) {
                    $uniqueStories[$storyId] = $story;
                }
            }

            return $this->successResponse([
                'stories' => array_values($uniqueStories),
                'count' => count($uniqueStories),
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
     * Get a single published story by ID (Public endpoint)
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function getPublishedStory(int $id): JsonResponse
    {
        try {
            $story = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->leftJoin('category_regions', 'story_categories.id', '=', 'category_regions.category_id')
                ->leftJoin('regions', 'category_regions.region_id', '=', 'regions.id')
                ->where('stories.id', $id)
                ->where('stories.status', 'published')
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'stories.published_at',
                    'users.name as author_name',
                    'story_categories.id as category_id',
                    'story_categories.name as category_name',
                    'regions.id as region_id',
                    'regions.name as region_name',
                    'regions.code as region_code'
                )
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
     * Get pending stories for review (Super admin only)
     * 
     * @return JsonResponse
     */
    public function getPendingStories(): JsonResponse
    {
        try {
            $stories = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.status', 'pending')
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'users.id as user_id',
                    'users.name as author_name',
                    'users.email as author_email',
                    'story_categories.id as category_id',
                    'story_categories.name as category_name'
                )
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
     * 
     * @return JsonResponse
     */
    public function getPendingCount(): JsonResponse
    {
        try {
            $count = DB::table('stories')
                ->where('status', 'pending')
                ->count();

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
     * Create a new story (Reader only)
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
            if (!PermissionHelper::canPostStories($user)) {
                return $this->errorResponse('You do not have permission to post stories', 403);
            }

            // Check if user has access to this category
            // Access can be from:
            // 1. Direct access (reader_category_access table)
            // 2. Region-based access (category_regions table matching user's region)
            $hasCategoryAccess = DB::table('reader_category_access')
                ->where('user_id', $userId)
                ->where('category_id', $request->category_id)
                ->exists();

            // Check region-based access
            $hasRegionAccess = false;
            if ($user->region_id) {
                $hasRegionAccess = DB::table('category_regions')
                    ->where('category_id', $request->category_id)
                    ->where('region_id', $user->region_id)
                    ->exists();
            }

            // Super admins have access to all categories
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            $isSuperAdmin = $user->role_id == $superAdminRoleId;

            if (!$isSuperAdmin && !$hasCategoryAccess && !$hasRegionAccess) {
                return $this->errorResponse('You do not have access to post in this category', 403);
            }

            // Verify category is active
            $category = DB::table('story_categories')
                ->where('id', $request->category_id)
                ->where('is_active', true)
                ->first();

            if (!$category) {
                return $this->errorResponse('Category not found or inactive', 404);
            }

            // Create story with pending status
            $story = Story::create([
                'user_id' => $userId,
                'category_id' => $request->category_id,
                'title' => $request->title,
                'content' => $request->content,
                'status' => 'pending',
            ]);

            // Get story with relations
            $storyWithDetails = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.id', $story->id)
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'users.name as author_name',
                    'story_categories.name as category_name'
                )
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
     * Approve and publish a story (Super admin only)
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

            // Get authenticated admin user (you'll need to implement authentication middleware)
            $adminUserId = $request->input('admin_user_id');
            if (!$adminUserId) {
                return $this->errorResponse('Admin user ID is required', 400);
            }

            $adminUser = User::find($adminUserId);
            if (!$adminUser) {
                return $this->errorResponse('Admin user not found', 404);
            }

            // Check if user can manage story categories (super admin permission)
            if (!PermissionHelper::canManageStoryCategories($adminUser)) {
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
     * Reject a story (Super admin only)
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
     * Get stories for a reader (their own stories)
     * 
     * @param int $userId
     * @return JsonResponse
     */
    public function getReaderStories(int $userId): JsonResponse
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

            $stories = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.approved_by', $adminId)
                ->where('stories.status', 'published')
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.content',
                    'stories.status',
                    'stories.created_at',
                    'stories.published_at',
                    'stories.approved_at',
                    'users.id as user_id',
                    'users.name as author_name',
                    'users.email as author_email',
                    'story_categories.id as category_id',
                    'story_categories.name as category_name'
                )
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
     * Get all approved stories by any admin (Super admin only)
     * 
     * @return JsonResponse
     */
    public function getAllApprovedStories(): JsonResponse
    {
        try {
            $stories = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->leftJoin('users as approvers', 'stories.approved_by', '=', 'approvers.id')
                ->where('stories.status', 'published')
                ->whereNotNull('stories.approved_by')
                ->select(
                    'stories.id',
                    'stories.title',
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
                )
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
     * Update a story (Super admin only)
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
                return $this->errorResponse('You do not have permission to edit stories', 403);
            }

            // Only allow editing published stories
            if ($story->status !== 'published') {
                return $this->errorResponse('Only published stories can be edited', 400);
            }

            // Update story
            if ($request->has('title')) {
                $story->title = $request->title;
            }
            if ($request->has('content')) {
                $story->content = $request->content;
            }
            if ($request->has('category_id')) {
                $story->category_id = $request->category_id;
            }
            $story->save();

            // Get updated story with relations
            $storyWithDetails = DB::table('stories')
                ->join('users', 'stories.user_id', '=', 'users.id')
                ->join('story_categories', 'stories.category_id', '=', 'story_categories.id')
                ->where('stories.id', $story->id)
                ->select(
                    'stories.id',
                    'stories.title',
                    'stories.content',
                    'stories.status',
                    'stories.published_at',
                    'users.name as author_name',
                    'story_categories.name as category_name'
                )
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

