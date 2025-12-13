<?php

/** @var \Laravel\Lumen\Routing\Router $router */

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$router->group(['prefix' => 'api'], function () use ($router) {
    // Health check endpoint
    $router->get('/health', 'HealthController@check');
    
    // Authentication routes
    $router->post('/auth/login', 'AuthController@login');
    
    // OAuth BFF routes
    $router->post('/auth/oauth/callback', 'AuthController@oauthCallback');
    $router->get('/auth/me', ['middleware' => 'auth.session', 'uses' => 'AuthController@getCurrentUser']);
    $router->post('/auth/logout', ['middleware' => 'auth.session', 'uses' => 'AuthController@logout']);
    
    // Add more auth routes as needed
    // $router->post('/auth/register', 'AuthController@register');

    // Organization management routes (for super admin) - Protected
    $router->group(['prefix' => 'organizations', 'middleware' => 'auth.session'], function () use ($router) {
        $router->get('/', 'OrganizationController@index');
        $router->get('/{id}', 'OrganizationController@show');
        $router->post('/', 'OrganizationController@store');
        $router->put('/{id}', 'OrganizationController@update');
        $router->patch('/{id}/toggle-status', 'OrganizationController@toggleStatus');
        $router->delete('/{id}', 'OrganizationController@destroy');
    });

    // User management routes (for super admin) - Protected
    $router->group(['prefix' => 'users', 'middleware' => 'auth.session'], function () use ($router) {
        $router->get('/', 'UserController@index');
        $router->post('/', 'UserController@store');
        $router->get('/roles', 'UserController@getRoles');
        $router->put('/{id}/role', 'UserController@updateRole');
        $router->patch('/{id}/toggle-status', 'UserController@toggleStatus');
        $router->delete('/{id}', 'UserController@destroy');
    });

    // Activity routes (user-specific) - Protected
    $router->group(['prefix' => 'activities', 'middleware' => 'auth.session'], function () use ($router) {
        $router->get('/', 'ActivityController@index');
        $router->post('/', 'ActivityController@store');
    });

    // Region routes - Public (no authentication required)
    $router->group(['prefix' => 'regions'], function () use ($router) {
        $router->get('/', 'RegionController@index');
    });

    // Story category routes
    // Public route - Get all categories (for home page, filters, etc.)
    $router->group(['prefix' => 'story-categories'], function () use ($router) {
        $router->get('/', 'StoryCategoryController@index');
    });

    // Story category management routes - Protected (super admin only)
    $router->group(['prefix' => 'story-categories', 'middleware' => 'auth.session'], function () use ($router) {
        $router->post('/', 'StoryCategoryController@store');
        $router->put('/{id}', 'StoryCategoryController@update');
        $router->patch('/{id}/toggle-status', 'StoryCategoryController@toggleStatus');
        $router->delete('/{id}', 'StoryCategoryController@destroy');
        $router->get('/writers', 'StoryCategoryController@getWritersWithAccess');
        $router->get('/writers/{userId}', 'StoryCategoryController@getWriterCategories');
        $router->put('/writers/{userId}/access', 'StoryCategoryController@updateWriterAccess');
    });

    // Story routes
    // CRITICAL: Static routes MUST come before variable routes to avoid shadowing
    // Register all static routes first, then variable routes
    $router->group(['prefix' => 'stories'], function () use ($router) {
        // Step 1: ALL static GET routes first (public and protected)
        $router->get('/published', 'StoryController@getPublishedStories');
        
        // Protected static routes - register directly with middleware
        $router->get('/pending', ['middleware' => 'auth.session', 'uses' => 'StoryController@getPendingStories']);
        $router->get('/pending/count', ['middleware' => 'auth.session', 'uses' => 'StoryController@getPendingCount']);
        $router->get('/approved/all', ['middleware' => 'auth.session', 'uses' => 'StoryController@getAllApprovedStories']);
        
        // Step 2: Routes with specific patterns (more specific than /{id})
        $router->get('/slug/{slug}', 'StoryController@getPublishedStoryBySlug');
        $router->get('/approved/{adminId}', ['middleware' => 'auth.session', 'uses' => 'StoryController@getApprovedStories']);
        $router->get('/writer/{userId}', ['middleware' => 'auth.session', 'uses' => 'StoryController@getWriterStories']);
        
        // Step 3: Protected POST/PUT/DELETE routes (different HTTP methods, won't conflict)
        $router->group(['middleware' => 'auth.session'], function () use ($router) {
            $router->post('/', 'StoryController@store');
            $router->post('/{id}/approve', 'StoryController@approve');
            $router->post('/{id}/reject', 'StoryController@reject');
            $router->put('/{id}', 'StoryController@update');
            $router->delete('/{id}', 'StoryController@destroy');
        });
        
        // Step 4: Public GET /{id} route - MUST be absolutely last
        $router->get('/{id}', 'StoryController@getPublishedStory');
    });
});

