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
            // Try to refresh if we have a refresh token
            if ($session->oauth_refresh_token) {
                try {
                    $this->attemptTokenRefresh($session);
                    // Reload session after refresh
                    $session = Session::find($sessionId);
                    
                    // Check again if still expired (refresh might have failed)
                    if ($session->isExpired()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Unauthorized - Session expired and refresh failed'
                        ], 401);
                    }
                } catch (\Exception $e) {
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
                // No refresh token available
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
