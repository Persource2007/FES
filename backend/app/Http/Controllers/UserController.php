<?php

namespace App\Http\Controllers;

use App\Helpers\PermissionHelper;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * User Management Controller
 * 
 * Handles user CRUD operations for super admin.
 */
class UserController extends Controller
{
    /**
     * Get all users (excluding super admins)
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            // Get super admin role ID
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            if (!$superAdminRoleId) {
                return $this->errorResponse('Super admin role not found', 404);
            }

            // Get all users except super admins, with their roles, organizations, and regions
            $users = DB::table('users')
                ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('organizations', 'users.organization_id', '=', 'organizations.id')
                ->leftJoin('regions', 'users.region_id', '=', 'regions.id')
                ->where('users.role_id', '!=', $superAdminRoleId)
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.role_id',
                    'users.organization_id',
                    'users.region_id',
                    'roles.role_name',
                    'organizations.name as organization_name',
                    'regions.name as region_name',
                    'users.is_active',
                    'users.created_at',
                    'users.updated_at'
                )
                ->orderBy('users.created_at', 'desc')
                ->get();

            return $this->successResponse([
                'users' => $users,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching users', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching users',
                500
            );
        }
    }

    /**
     * Create a new user
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'organization_id' => 'required|integer|exists:organizations,id',
                'email' => 'required|email|max:255|unique:users,email',
                'password' => 'required|string|min:1',
                'role_id' => 'required|integer|exists:roles,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Check that role is not Super admin
            $role = DB::table('roles')->where('id', $request->role_id)->first();
            if ($role && $role->role_name === 'Super admin') {
                return $this->errorResponse('Cannot create Super admin user', 403);
            }

            // Get organization's region_id
            $organization = DB::table('organizations')
                ->where('id', $request->organization_id)
                ->first();

            if (!$organization) {
                return $this->errorResponse('Organization not found', 404);
            }

            // Create user with organization_id and set region_id from organization
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role_id' => $request->role_id,
                'organization_id' => $request->organization_id,
                'region_id' => $organization->region_id, // Set region from organization
            ]);

            // If user has organization and can post stories, grant access to categories for that organization
            if ($user->organization_id && PermissionHelper::canPostStories($user)) {
                $this->grantOrganizationBasedCategoryAccess($user);
            }

            // Get user with role, organization, and region
            $userWithRole = DB::table('users')
                ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('organizations', 'users.organization_id', '=', 'organizations.id')
                ->leftJoin('regions', 'users.region_id', '=', 'regions.id')
                ->where('users.id', $user->id)
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.role_id',
                    'users.organization_id',
                    'users.region_id',
                    'roles.role_name',
                    'organizations.name as organization_name',
                    'regions.name as region_name',
                    'users.created_at',
                    'users.updated_at'
                )
                ->first();

            return $this->successResponse([
                'message' => 'User created successfully',
                'user' => $userWithRole,
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating user', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while creating user',
                500
            );
        }
    }

    /**
     * Update user role
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        try {
            // Find user first to check if exists and for email validation
            $user = User::find($id);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $id,
                'role_id' => 'required|integer|exists:roles,id',
                'organization_id' => 'required|integer|exists:organizations,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 400);
            }

            // Check if user is super admin
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            if ($user->role_id == $superAdminRoleId) {
                return $this->errorResponse('Cannot modify Super admin user', 403);
            }

            // Check that new role is not Super admin
            $newRole = DB::table('roles')->where('id', $request->role_id)->first();
            if ($newRole && $newRole->role_name === 'Super admin') {
                return $this->errorResponse('Cannot assign Super admin role', 403);
            }

            // Get organization and update organization_id and region_id
            $organization = DB::table('organizations')
                ->where('id', $request->organization_id)
                ->first();

            if (!$organization) {
                return $this->errorResponse('Organization not found', 404);
            }

            // Update user fields
            $user->name = $request->name;
            $user->email = $request->email;
            $user->role_id = $request->role_id;
            $user->organization_id = $request->organization_id;
            $user->region_id = $organization->region_id; // Set region from organization
            $user->save();

            // Get updated user with role, organization, and region
            $userWithRole = DB::table('users')
                ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('organizations', 'users.organization_id', '=', 'organizations.id')
                ->leftJoin('regions', 'users.region_id', '=', 'regions.id')
                ->where('users.id', $user->id)
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.role_id',
                    'users.organization_id',
                    'roles.role_name',
                    'users.region_id',
                    'organizations.name as organization_name',
                    'regions.name as region_name',
                    'users.created_at',
                    'users.updated_at'
                )
                ->first();

            return $this->successResponse([
                'message' => 'User role updated successfully',
                'user' => $userWithRole,
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating user role', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating user role',
                500
            );
        }
    }

    /**
     * Toggle user active status
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function toggleStatus(int $id): JsonResponse
    {
        try {
            // Find user
            $user = User::find($id);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            // Check if user is super admin
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            if ($user->role_id == $superAdminRoleId) {
                return $this->errorResponse('Cannot deactivate Super admin user', 403);
            }

            // Toggle status (default to true if column doesn't exist yet)
            $currentStatus = $user->is_active ?? true;
            $user->is_active = !$currentStatus;
            $user->save();

            // Get updated user with role, organization, and region
            $userWithRole = DB::table('users')
                ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
                ->leftJoin('organizations', 'users.organization_id', '=', 'organizations.id')
                ->leftJoin('regions', 'users.region_id', '=', 'regions.id')
                ->where('users.id', $user->id)
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.role_id',
                    'users.organization_id',
                    'roles.role_name',
                    'users.region_id',
                    'organizations.name as organization_name',
                    'regions.name as region_name',
                    'users.is_active',
                    'users.created_at',
                    'users.updated_at'
                )
                ->first();

            return $this->successResponse([
                'message' => 'User status updated successfully',
                'user' => $userWithRole,
            ]);
        } catch (\Exception $e) {
            Log::error('Error toggling user status', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while updating user status',
                500
            );
        }
    }

    /**
     * Delete a user
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            // Find user
            $user = User::find($id);
            if (!$user) {
                return $this->errorResponse('User not found', 404);
            }

            // Check if user is super admin
            $superAdminRoleId = DB::table('roles')
                ->where('role_name', 'Super admin')
                ->value('id');

            if ($user->role_id == $superAdminRoleId) {
                return $this->errorResponse('Cannot delete Super admin user', 403);
            }

            // Delete user
            $user->delete();

            return $this->successResponse([
                'message' => 'User deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting user', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred while deleting user',
                500
            );
        }
    }

    /**
     * Get all available roles (excluding Super admin)
     * 
     * @return JsonResponse
     */
    public function getRoles(): JsonResponse
    {
        try {
            $roles = DB::table('roles')
                ->where('role_name', '!=', 'Super admin')
                ->select('id', 'role_name')
                ->orderBy('role_name', 'asc')
                ->get();

            return $this->successResponse([
                'roles' => $roles,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching roles', [
                'message' => $e->getMessage(),
            ]);

            return $this->errorResponse(
                'An error occurred while fetching roles',
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
     * Grant organization-based category access to a user
     * Access is now managed through category_organizations table
     * Writers automatically get access to categories assigned to their organization
     * This method is deprecated - no longer needed
     * 
     * @param User $user
     * @return void
     */
    private function grantOrganizationBasedCategoryAccess(User $user): void
    {
        // Access is now managed through category_organizations table
        // Writers automatically get access to categories assigned to their organization
        // No need to populate reader_category_access table anymore
        return;
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

