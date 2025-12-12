<?php

namespace App\Http\Middleware;

use App\Http\Controllers\AuthController;
use App\Models\Session;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Authenticate Session Middleware
 * 
 * Validates user sessions by checking the session cookie.
 * Automatically refreshes access tokens when they're about to expire.
 * Attaches the authenticated user to the request for use in controllers.
 * Part of the BFF (Backend for Frontend) implementation.
 */
class AuthenticateSession
{
    /**
     * Number of minutes before expiration to refresh the token
     * 
     * @var int
     */
    private const REFRESH_THRESHOLD_MINUTES = 5;

    /**
     * Handle an incoming request.
     * 
     * This middleware handles automatic token refresh:
     * 
     * Scenario 1: Token is expired but refresh token is valid
     *   - Automatically refreshes the access token using refresh token
     *   - Updates session with new token and expiry
     *   - Continues with the request (user stays logged in)
     * 
     * Scenario 2: Token is expired and refresh token is also expired/invalid
     *   - Attempts to refresh but OAuth server rejects it
     *   - Returns 401 Unauthorized (user needs to login again)
     * 
     * Scenario 3: Token is still valid
     *   - Checks if token expires within threshold (5 minutes)
     *   - If yes, proactively refreshes it
     *   - Continues with the request
     *
     * @param Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $sessionId = $request->cookie('session_id');
        
        if (!$sessionId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - No session found'
            ], 401);
        }
        
        // Get session from database
        $sessionData = DB::table('sessions')
            ->where('id', $sessionId)
            ->first();
        
        if (!$sessionData) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Session not found'
            ], 401);
        }
        
        // Load session model for easier access
        $session = Session::find($sessionId);
        
        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Session not found'
            ], 401);
        }
        
        // Check if session is expired
        if ($session->isExpired()) {
            // Token is expired - try to refresh using refresh token
            if ($session->oauth_refresh_token) {
                try {
                    Log::info('Token expired, attempting refresh', [
                        'session_id' => $sessionId,
                    ]);
                    
                    $this->attemptTokenRefresh($session);
                    
                    // Reload session after refresh to get updated expiry
                    $session = Session::find($sessionId);
                    
                    // Check again if still expired (refresh might have failed)
                    if ($session->isExpired()) {
                        Log::warning('Token refresh failed - session still expired', [
                            'session_id' => $sessionId,
                        ]);
                        
                        return response()->json([
                            'success' => false,
                            'message' => 'Unauthorized - Session expired and refresh failed'
                        ], 401);
                    }
                    
                    Log::info('Token refreshed successfully', [
                        'session_id' => $sessionId,
                        'new_expires_at' => $session->expires_at,
                    ]);
                } catch (\Exception $e) {
                    // Refresh token is expired/invalid or OAuth server error
                    Log::warning('Token refresh failed in middleware', [
                        'session_id' => $sessionId,
                        'error' => $e->getMessage(),
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized - Session expired'
                    ], 401);
                }
            } else {
                // No refresh token available - user needs to login again
                Log::warning('Token expired but no refresh token available', [
                    'session_id' => $sessionId,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Session expired'
                ], 401);
            }
        } else {
            // Session is still valid, but check if we should refresh proactively
            $this->refreshIfNeeded($session);
        }
        
        // Attach user to request
        $user = User::find($session->user_id);
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - User not found'
            ], 401);
        }
        
        // Attach user to request for use in controllers
        $request->merge(['user_id' => $user->id]);
        $request->setUserResolver(function () use ($user) {
            return $user;
        });
        
        return $next($request);
    }

    /**
     * Check if token needs refresh and refresh if needed
     * 
     * @param Session $session
     * @return void
     */
    private function refreshIfNeeded(Session $session): void
    {
        // Check if token expires within the threshold
        $expiresAt = $session->expires_at;
        $threshold = \Carbon\Carbon::now()->addMinutes(self::REFRESH_THRESHOLD_MINUTES);
        
        if ($expiresAt->lte($threshold) && $session->oauth_refresh_token) {
            // Token is about to expire, refresh it
            try {
                $this->attemptTokenRefresh($session);
                Log::info('Token refreshed proactively', [
                    'session_id' => $session->id,
                ]);
            } catch (\Exception $e) {
                Log::warning('Proactive token refresh failed', [
                    'session_id' => $session->id,
                    'error' => $e->getMessage(),
                ]);
                // Don't fail the request if proactive refresh fails
                // The token is still valid, we'll try again next time
            }
        }
    }

    /**
     * Attempt to refresh the access token using the refresh token
     * 
     * @param Session $session
     * @return void
     * @throws \Exception
     */
    private function attemptTokenRefresh(Session $session): void
    {
        $refreshToken = $session->getRefreshToken();
        
        if (!$refreshToken) {
            throw new \Exception('No refresh token available');
        }
        
        // Use AuthController to refresh token (resolve from container)
        $authController = app(AuthController::class);
        $tokenResponse = $authController->refreshAccessToken($refreshToken);
        
        // Update session with new tokens
        $authController->updateSessionTokens($session->id, $tokenResponse);
    }
}
