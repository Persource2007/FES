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
    // Add more auth routes as needed
    // $router->post('/auth/register', 'AuthController@register');
    // $router->post('/auth/logout', 'AuthController@logout');

    // Organization management routes (for super admin)
    $router->group(['prefix' => 'organizations'], function () use ($router) {
        $router->get('/', 'OrganizationController@index');
        $router->post('/', 'OrganizationController@store');
        $router->put('/{id}', 'OrganizationController@update');
        $router->patch('/{id}/toggle-status', 'OrganizationController@toggleStatus');
        $router->delete('/{id}', 'OrganizationController@destroy');
    });

    // User management routes (for super admin)
    $router->group(['prefix' => 'users'], function () use ($router) {
        $router->get('/', 'UserController@index');
        $router->post('/', 'UserController@store');
        $router->get('/roles', 'UserController@getRoles');
        $router->put('/{id}/role', 'UserController@updateRole');
        $router->patch('/{id}/toggle-status', 'UserController@toggleStatus');
        $router->delete('/{id}', 'UserController@destroy');
    });

    // Activity routes (user-specific)
    $router->group(['prefix' => 'activities'], function () use ($router) {
        $router->get('/', 'ActivityController@index');
        $router->post('/', 'ActivityController@store');
    });

    // Region routes
    $router->group(['prefix' => 'regions'], function () use ($router) {
        $router->get('/', 'RegionController@index');
    });

    // Story category routes (super admin only)
    $router->group(['prefix' => 'story-categories'], function () use ($router) {
        $router->get('/', 'StoryCategoryController@index');
        $router->post('/', 'StoryCategoryController@store');
        $router->put('/{id}', 'StoryCategoryController@update');
        $router->patch('/{id}/toggle-status', 'StoryCategoryController@toggleStatus');
        $router->delete('/{id}', 'StoryCategoryController@destroy');
        $router->get('/writers', 'StoryCategoryController@getWritersWithAccess');
        $router->get('/writers/{userId}', 'StoryCategoryController@getWriterCategories');
        $router->put('/writers/{userId}/access', 'StoryCategoryController@updateWriterAccess');
    });

    // Story routes
    // IMPORTANT: Specific routes must come before variable routes to avoid shadowing
    $router->group(['prefix' => 'stories'], function () use ($router) {
        // Public endpoints
        $router->get('/published', 'StoryController@getPublishedStories');
        
        // Specific routes (must be before /{id})
        $router->get('/pending', 'StoryController@getPendingStories');
        $router->get('/pending/count', 'StoryController@getPendingCount');
        $router->get('/approved/all', 'StoryController@getAllApprovedStories');
        $router->get('/approved/{adminId}', 'StoryController@getApprovedStories');
        $router->get('/writer/{userId}', 'StoryController@getWriterStories');
        
        // Story actions
        $router->post('/', 'StoryController@store');
        $router->post('/{id}/approve', 'StoryController@approve');
        $router->post('/{id}/reject', 'StoryController@reject');
        
        // Variable routes (must be last)
        $router->get('/{id}', 'StoryController@getPublishedStory'); // Public endpoint - get single story
        $router->put('/{id}', 'StoryController@update');
        $router->delete('/{id}', 'StoryController@destroy');
    });
});

