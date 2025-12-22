<?php

namespace App\Http\Middleware;

use App\Http\Controllers\AuthController;
use App\Models\Session;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Authenticate Session Middleware
 * 
 * Validates user sessions by checking the session cookie.
 * Automatically refreshes access tokens when they're about to expire.
 * Extends session cookie expiry to 7 days when refresh token is successfully used.
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
     *   - Extends session cookie expiry to 7 days from now
     *   - Continues with the request (user stays logged in)
     * 
     * Scenario 2: Token is expired and refresh token is also expired/invalid
     *   - Attempts to refresh but OAuth server rejects it
     *   - Returns 401 Unauthorized (user needs to login again)
     * 
     * Scenario 3: Token is still valid
     *   - Checks if token expires within threshold (5 minutes)
     *   - If yes, proactively refreshes it
     *   - Extends session cookie expiry to 7 days from now
     *   - Continues with the request
     *
     * @param Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $sessionId = $request->cookie('session_id');
        $cookieToRefresh = null; // Track if we need to refresh the cookie
        
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
            // Session not found - clear the invalid cookie
            Log::warning('Session not found in database, clearing cookie', [
                'session_id' => $sessionId,
            ]);
            
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
            
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Session not found'
            ], 401)->cookie($cookie);
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
            // OAuth server will validate if refresh token is still valid
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
                    
                    // Refresh the session cookie to extend expiry to 7 days
                    // This ensures the session remains valid after successful token refresh
                    $cookieToRefresh = $this->createRefreshedSessionCookie($sessionId);
                } catch (\Exception $e) {
                    // Refresh token is expired/invalid (OAuth server rejected it) or OAuth server error
                    // OAuth server is the source of truth for refresh token validity
                    Log::warning('Token refresh failed - OAuth server rejected refresh token', [
                        'session_id' => $sessionId,
                        'error' => $e->getMessage(),
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized - Refresh token expired. Please login again.'
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
            $this->refreshIfNeeded($session, $cookieToRefresh);
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
        
        // Get the response from the next middleware/controller
        $response = $next($request);
        
        // If cookie was refreshed during token refresh, attach it to the response
        if ($cookieToRefresh !== null) {
            $expiryTimestamp = $cookieToRefresh->getExpiresTime();
            $currentTimestamp = time();
            $expiresInSeconds = $expiryTimestamp - $currentTimestamp;
            $expiresInDays = $expiresInSeconds / (60 * 60 * 24);
            
            Log::info('Attaching refreshed session cookie to response', [
                'session_id' => $cookieToRefresh->getValue(),
                'cookie_expires_at_timestamp' => $expiryTimestamp,
                'cookie_expires_at_readable' => date('Y-m-d H:i:s', $expiryTimestamp),
                'current_timestamp' => $currentTimestamp,
                'current_time_readable' => date('Y-m-d H:i:s', $currentTimestamp),
                'expires_in_seconds' => $expiresInSeconds,
                'expires_in_days' => round($expiresInDays, 2),
                'expires_in_hours' => round($expiresInSeconds / 3600, 2),
            ]);
            $response->headers->setCookie($cookieToRefresh);
        }
        
        return $response;
    }

    /**
     * Create a refreshed session cookie with 7 days expiry
     * 
     * This extends the session cookie expiry to 7 days from now.
     * Used when a refresh token is successfully used to get a new access token.
     * 
     * @param string $sessionId Session ID
     * @return Cookie Refreshed session cookie
     */
    private function createRefreshedSessionCookie(string $sessionId): Cookie
    {
        // Calculate 7 days in seconds
        $sevenDaysInSeconds = 60 * 60 * 24 * 7; // 604800 seconds
        $currentTime = time();
        $expiryTime = $currentTime + $sevenDaysInSeconds;
        
        // Log the cookie expiry calculation for debugging
        Log::info('Creating refreshed session cookie', [
            'session_id' => $sessionId,
            'current_timestamp' => $currentTime,
            'current_time_readable' => date('Y-m-d H:i:s', $currentTime),
            'expiry_timestamp' => $expiryTime,
            'expiry_time_readable' => date('Y-m-d H:i:s', $expiryTime),
            'expires_in_seconds' => $sevenDaysInSeconds,
            'expires_in_days' => $sevenDaysInSeconds / (60 * 60 * 24),
            'expires_in_hours' => $sevenDaysInSeconds / 3600,
        ]);
        
        return new Cookie(
            'session_id',
            $sessionId,
            $expiryTime,
            '/',
            null, // domain
            config('app.env') === 'production', // secure (HTTPS only in production)
            true, // httpOnly
            false, // raw
            'lax' // sameSite
        );
    }

    /**
     * Check if token needs refresh and refresh if needed
     * 
     * @param Session $session
     * @param Cookie|null &$cookieToRefresh Reference to cookie variable to set if refresh happens
     * @return void
     */
    private function refreshIfNeeded(Session $session, ?Cookie &$cookieToRefresh = null): void
    {
        // Check if token expires within the threshold
        $expiresAt = $session->expires_at;
        $threshold = \Carbon\Carbon::now()->addMinutes(self::REFRESH_THRESHOLD_MINUTES);
        
        // Only refresh if:
        // 1. Access token expires within threshold
        // 2. Refresh token exists
        // OAuth server will validate refresh token validity when we attempt refresh
        if ($expiresAt->lte($threshold) && $session->oauth_refresh_token) {
            // Token is about to expire, refresh it
            // OAuth server will reject if refresh token is expired
            try {
                $this->attemptTokenRefresh($session);
                Log::info('Token refreshed proactively', [
                    'session_id' => $session->id,
                ]);
                
                // Refresh the session cookie to extend expiry to 7 days
                // This ensures the session remains valid after successful token refresh
                $cookieToRefresh = $this->createRefreshedSessionCookie($session->id);
            } catch (\Exception $e) {
                Log::warning('Proactive token refresh failed - OAuth server may have rejected refresh token', [
                    'session_id' => $session->id,
                    'error' => $e->getMessage(),
                ]);
                // Don't fail the request if proactive refresh fails
                // The token is still valid, we'll try again next time
                // If refresh token is expired, OAuth server will reject it and user will be forced to login on next request
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
