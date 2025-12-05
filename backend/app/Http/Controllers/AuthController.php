<?php

namespace App\Http\Controllers;

use App\Helpers\PermissionHelper;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Authentication Controller
 * 
 * Handles authentication-related requests including login.
 */
class AuthController extends Controller
{
    /**
     * Login endpoint
     * 
     * Validates user credentials and returns user data on success.
     * For now, uses dummy validation (logs the request without actual password checking).
     * 
     * @param Request $request HTTP request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        try {
            // Validate request data
            $validated = LoginRequest::validate($request);
            $email = $validated['email'];
            $password = $validated['password'];

            // Log the login attempt (for debugging)
            Log::info('Login attempt', [
                'email' => $email,
                'ip' => $request->ip(),
            ]);

            // Find user by email with role relationship
            $user = User::where('email', $email)->first();

            // Dummy validation: Check if user exists
            // In production, you would verify the password hash here
            // For now, we'll just check if user exists
            if (!$user) {
                return $this->errorResponse(
                    'Invalid credentials',
                    401
                );
            }

            // TODO: In production, uncomment and use password verification:
            // if (!Hash::check($password, $user->password)) {
            //     return $this->errorResponse(
            //         'Invalid credentials',
            //         401
            //     );
            // }

            // Get user's role from database
            $role = null;
            if ($user->role_id) {
                $roleResult = \Illuminate\Support\Facades\DB::table('roles')
                    ->where('id', $user->role_id)
                    ->first();
                if ($roleResult) {
                    $role = [
                        'id' => $roleResult->id,
                        'name' => $roleResult->role_name,
                    ];
                }
            }

            // Get user permissions (with error handling in case permissions table doesn't exist yet)
            $permissions = [];
            try {
                $permissions = PermissionHelper::getUserPermissions($user);
            } catch (\Exception $e) {
                // If permissions table doesn't exist yet, return empty array
                // This allows the app to work before permissions are set up
                Log::warning('Could not fetch user permissions', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $permissions = [];
            }

            // Get organization name if user has an organization
            $organizationName = null;
            if ($user->organization_id) {
                try {
                    $organization = \Illuminate\Support\Facades\DB::table('organizations')
                        ->where('id', $user->organization_id)
                        ->first();
                    if ($organization) {
                        $organizationName = $organization->name;
                    }
                } catch (\Exception $e) {
                    // If organizations table doesn't exist, organizationName will be null
                    Log::warning('Could not fetch organization name', [
                        'user_id' => $user->id,
                        'organization_id' => $user->organization_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Return success response with user data including role and permissions
            return $this->successResponse([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => $role,
                    'role_name' => $role ? $role['name'] : null, // Add role_name for backward compatibility
                    'organization_id' => $user->organization_id,
                    'organization_name' => $organizationName, // Add organization_name
                    'permissions' => $permissions,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Login error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->errorResponse(
                'An error occurred during login',
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

