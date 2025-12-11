<?php

namespace App\Http\Controllers;

use App\Helpers\PermissionHelper;
use App\Http\Requests\LoginRequest;
use App\Models\Session;
use App\Models\User;
use GuzzleHttp\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Cookie;

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

    /**
     * OAuth callback endpoint
     * 
     * Receives authorization code from frontend and exchanges it for tokens server-side.
     * Creates a session and returns user info with HTTP-only cookie.
     * 
     * @param Request $request HTTP request
     * @return JsonResponse
     */
    public function oauthCallback(Request $request): JsonResponse
    {
        try {
            // 1. Get authorization code from frontend
            $code = $request->input('code');
            $codeVerifier = $request->input('code_verifier'); // From PKCE
            
            if (!$code || !$codeVerifier) {
                return $this->errorResponse('Code and code verifier are required', 400);
            }
            
            // 2. Exchange code for tokens (server-side, tokens never exposed to browser)
            $tokenResponse = $this->exchangeCodeForToken($code, $codeVerifier);
            
            if (!isset($tokenResponse['access_token'])) {
                return $this->errorResponse('Failed to obtain access token', 400);
            }
            
            // 3. Get user info from OAuth server
            $userInfo = $this->getUserInfoFromOAuth($tokenResponse['access_token']);
            
            if (!isset($userInfo['email'])) {
                return $this->errorResponse('Email not found in user info', 400);
            }
            
            // 4. Check if user exists in your database with role
            $user = User::where('email', $userInfo['email'])->first();
            
            if (!$user) {
                return $this->errorResponse(
                    'User not found in database. Please contact the administrator to create an account for you.',
                    404
                );
            }
            
            if (!$user->role_id) {
                return $this->errorResponse(
                    'No role assigned to your account. Please contact the administrator to assign a role before proceeding.',
                    403
                );
            }
            
            // 5. Create local session (store in database)
            $sessionId = $this->createUserSession($user, $tokenResponse);
            
            // 6. Get user role
            $role = null;
            if ($user->role_id) {
                $roleResult = DB::table('roles')->where('id', $user->role_id)->first();
                if ($roleResult) {
                    $role = [
                        'id' => $roleResult->id,
                        'name' => $roleResult->role_name,
                    ];
                }
            }

            // Get user permissions
            $permissions = [];
            try {
                $permissions = PermissionHelper::getUserPermissions($user);
            } catch (\Exception $e) {
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
                    $organization = DB::table('organizations')
                        ->where('id', $user->organization_id)
                        ->first();
                    if ($organization) {
                        $organizationName = $organization->name;
                    }
                } catch (\Exception $e) {
                    Log::warning('Could not fetch organization name', [
                        'user_id' => $user->id,
                        'organization_id' => $user->organization_id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
            
            // 7. Return session cookie (HTTP-only, secure)
            $cookie = new Cookie(
                'session_id',
                $sessionId,
                time() + (60 * 24 * 7), // 7 days
                '/',
                null, // domain
                config('app.env') === 'production', // secure (HTTPS only in production)
                true, // httpOnly
                false, // raw
                'lax' // sameSite
            );
            
            return $this->successResponse([
                'message' => 'Login successful',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $role,
                    'role_name' => $role ? $role['name'] : null,
                    'organization_id' => $user->organization_id,
                    'organization_name' => $organizationName,
                    'permissions' => $permissions,
                ],
            ])->cookie($cookie);
        } catch (\Exception $e) {
            Log::error('OAuth callback error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return $this->errorResponse('An error occurred during authentication', 500);
        }
    }

    /**
     * Exchange authorization code for access token
     * 
     * @param string $code Authorization code
     * @param string $codeVerifier PKCE code verifier
     * @return array Token response
     * @throws \Exception
     */
    private function exchangeCodeForToken(string $code, string $codeVerifier): array
    {
        $client = new Client();
        
        // OAuth configuration from config file
        $oauthServerUrl = config('oauth.server_url');
        $clientId = config('oauth.client_id');
        $clientSecret = config('oauth.client_secret');
        $redirectUri = config('oauth.redirect_uri');
        $tokenUrl = config('oauth.token_url') ?: "{$oauthServerUrl}/oauth2/token";
        
        try {
            $response = $client->post($tokenUrl, [
                'auth' => [$clientId, $clientSecret], // Basic Auth
                'form_params' => [
                    'grant_type' => 'authorization_code',
                    'code' => $code,
                    'redirect_uri' => $redirectUri,
                    'client_id' => $clientId,
                    'code_verifier' => $codeVerifier,
                ],
                'headers' => [
                    'Accept' => 'application/json',
                ],
            ]);
            
            $body = $response->getBody()->getContents();
            $tokenData = json_decode($body, true);
            
            if (!$tokenData || !isset($tokenData['access_token'])) {
                throw new \Exception('Invalid token response: ' . $body);
            }
            
            return $tokenData;
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : $e->getMessage();
            throw new \Exception('Token exchange failed: ' . $errorBody);
        }
    }

    /**
     * Get user info from OAuth server
     * 
     * @param string $accessToken OAuth access token
     * @return array User info
     * @throws \Exception
     */
    private function getUserInfoFromOAuth(string $accessToken): array
    {
        $client = new Client();
        $oauthServerUrl = config('oauth.server_url');
        $userinfoUrl = config('oauth.userinfo_url') ?: "{$oauthServerUrl}/userinfo";
        
        try {
            $response = $client->get($userinfoUrl, [
                'headers' => [
                    'Authorization' => "Bearer {$accessToken}",
                    'Accept' => 'application/json',
                ],
            ]);
            
            $body = $response->getBody()->getContents();
            $userInfo = json_decode($body, true);
            
            if (!$userInfo) {
                throw new \Exception('Invalid userinfo response: ' . $body);
            }
            
            return $userInfo;
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : $e->getMessage();
            throw new \Exception('Failed to get user info: ' . $errorBody);
        }
    }

    /**
     * Create user session in database
     * 
     * @param User $user User model
     * @param array $tokenResponse Token response from OAuth server
     * @return string Session ID
     */
    private function createUserSession(User $user, array $tokenResponse): string
    {
        // Generate unique session ID
        $sessionId = Str::random(40);
        
        // Encrypt tokens before storing
        $encryptedAccessToken = encrypt($tokenResponse['access_token']);
        $encryptedRefreshToken = isset($tokenResponse['refresh_token']) 
            ? encrypt($tokenResponse['refresh_token']) 
            : null;
        
        // Calculate expiration (default to 15 minutes if not provided)
        $expiresIn = $tokenResponse['expires_in'] ?? 900;
        $expiresAt = \Carbon\Carbon::now()->addSeconds($expiresIn);
        
        // Store in database
        DB::table('sessions')->insert([
            'id' => $sessionId,
            'user_id' => $user->id,
            'oauth_access_token' => $encryptedAccessToken,
            'oauth_refresh_token' => $encryptedRefreshToken,
            'expires_at' => $expiresAt,
            'created_at' => \Carbon\Carbon::now(),
            'updated_at' => \Carbon\Carbon::now(),
        ]);
        
        return $sessionId;
    }

    /**
     * Get current authenticated user
     * 
     * @param Request $request HTTP request
     * @return JsonResponse
     */
    public function getCurrentUser(Request $request): JsonResponse
    {
        $sessionId = $request->cookie('session_id');
        
        if (!$sessionId) {
            return $this->errorResponse('No active session', 401);
        }
        
        $session = DB::table('sessions')
            ->where('id', $sessionId)
            ->where('expires_at', '>', \Carbon\Carbon::now())
            ->first();
        
        if (!$session) {
            return $this->errorResponse('Session expired', 401);
        }
        
        $user = User::find($session->user_id);
        
        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }
        
        // Get role
        $role = null;
        if ($user->role_id) {
            $roleResult = DB::table('roles')->where('id', $user->role_id)->first();
            if ($roleResult) {
                $role = [
                    'id' => $roleResult->id,
                    'name' => $roleResult->role_name,
                ];
            }
        }

        // Get user permissions
        $permissions = [];
        try {
            $permissions = PermissionHelper::getUserPermissions($user);
        } catch (\Exception $e) {
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
                $organization = DB::table('organizations')
                    ->where('id', $user->organization_id)
                    ->first();
                if ($organization) {
                    $organizationName = $organization->name;
                }
            } catch (\Exception $e) {
                Log::warning('Could not fetch organization name', [
                    'user_id' => $user->id,
                    'organization_id' => $user->organization_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
                'role_name' => $role ? $role['name'] : null,
                'organization_id' => $user->organization_id,
                'organization_name' => $organizationName,
                'permissions' => $permissions,
            ],
        ]);
    }

    /**
     * Refresh OAuth access token using refresh token
     * 
     * @param string $refreshToken Refresh token
     * @return array New token response
     * @throws \Exception
     */
    public function refreshAccessToken(string $refreshToken): array
    {
        $client = new Client();
        
        // OAuth configuration from config file
        $oauthServerUrl = config('oauth.server_url');
        $clientId = config('oauth.client_id');
        $clientSecret = config('oauth.client_secret');
        $tokenUrl = config('oauth.token_url') ?: "{$oauthServerUrl}/oauth2/token";
        
        try {
            $response = $client->post($tokenUrl, [
                'auth' => [$clientId, $clientSecret], // Basic Auth
                'form_params' => [
                    'grant_type' => 'refresh_token',
                    'refresh_token' => $refreshToken,
                    'client_id' => $clientId,
                ],
                'headers' => [
                    'Accept' => 'application/json',
                ],
            ]);
            
            $body = $response->getBody()->getContents();
            $tokenData = json_decode($body, true);
            
            if (!$tokenData || !isset($tokenData['access_token'])) {
                throw new \Exception('Invalid refresh token response: ' . $body);
            }
            
            return $tokenData;
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            $errorBody = $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : $e->getMessage();
            throw new \Exception('Token refresh failed: ' . $errorBody);
        }
    }

    /**
     * Update session with new tokens after refresh
     * 
     * @param string $sessionId Session ID
     * @param array $tokenResponse New token response
     * @return void
     */
    public function updateSessionTokens(string $sessionId, array $tokenResponse): void
    {
        // Encrypt new tokens
        $encryptedAccessToken = encrypt($tokenResponse['access_token']);
        $encryptedRefreshToken = isset($tokenResponse['refresh_token']) 
            ? encrypt($tokenResponse['refresh_token']) 
            : null;
        
        // Calculate new expiration
        $expiresIn = $tokenResponse['expires_in'] ?? 900; // Default 15 minutes
        $expiresAt = \Carbon\Carbon::now()->addSeconds($expiresIn);
        
        // Update session
        $updateData = [
            'oauth_access_token' => $encryptedAccessToken,
            'expires_at' => $expiresAt,
            'updated_at' => \Carbon\Carbon::now(),
        ];
        
        // Only update refresh token if a new one was provided
        if ($encryptedRefreshToken) {
            $updateData['oauth_refresh_token'] = $encryptedRefreshToken;
        }
        
        DB::table('sessions')
            ->where('id', $sessionId)
            ->update($updateData);
    }

    /**
     * Logout endpoint
     * 
     * Deletes the session and clears the session cookie.
     * 
     * @param Request $request HTTP request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $sessionId = $request->cookie('session_id');
        
        if ($sessionId) {
            DB::table('sessions')->where('id', $sessionId)->delete();
        }
        
        // Create a cookie that expires immediately to delete it
        $cookie = new Cookie(
            'session_id',
            '',
            time() - 3600, // Expired (1 hour ago)
            '/',
            null,
            false,
            true,
            false,
            'lax'
        );
        
        return $this->successResponse(['message' => 'Logged out successfully'])
            ->cookie($cookie);
    }
}

