<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * CORS Middleware
 * 
 * Handles Cross-Origin Resource Sharing (CORS) headers
 * to allow requests from the React frontend.
 */
class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request
     * @param Closure $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Get allowed origins from environment or use defaults
        $allowedOrigins = env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://localhost:3001');
        $origins = array_map('trim', explode(',', $allowedOrigins));
        $origin = $request->header('Origin');

        // For development, allow requests from any localhost origin (including Swagger UI)
        $isDevelopment = env('APP_ENV', 'local') === 'local' || env('APP_DEBUG', false);
        
        // Determine which origin to allow
        // Note: Cannot use '*' when Access-Control-Allow-Credentials is true
        $allowedOrigin = null;
        if ($origin) {
            // Check if origin is in allowed list
            if (in_array($origin, $origins)) {
                $allowedOrigin = $origin;
            } 
            // In development, allow any localhost origin (for Swagger UI)
            elseif ($isDevelopment && (strpos($origin, 'http://localhost') === 0 || strpos($origin, 'http://127.0.0.1') === 0)) {
                $allowedOrigin = $origin;
            }
        }
        
        // Fallback: use first allowed origin (never use '*' with credentials)
        if (!$allowedOrigin && !empty($origins)) {
            $allowedOrigin = $origins[0];
        }

        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            // Must have an origin when using credentials
            if (!$allowedOrigin) {
                $allowedOrigin = !empty($origins) ? $origins[0] : ($origin ?: 'http://localhost:3000');
            }
            
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $allowedOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // Add CORS headers to response
        // Must have an origin when using credentials (cannot use '*')
        if (!$allowedOrigin) {
            $allowedOrigin = !empty($origins) ? $origins[0] : ($origin ?: 'http://localhost:3000');
        }
        
        $response->header('Access-Control-Allow-Origin', $allowedOrigin)
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
            ->header('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}

