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

    // User management routes (for super admin)
    $router->group(['prefix' => 'users'], function () use ($router) {
        $router->get('/', 'UserController@index');
        $router->post('/', 'UserController@store');
        $router->get('/roles', 'UserController@getRoles');
        $router->put('/{id}/role', 'UserController@updateRole');
        $router->delete('/{id}', 'UserController@destroy');
    });

    // Activity routes (user-specific)
    $router->group(['prefix' => 'activities'], function () use ($router) {
        $router->get('/', 'ActivityController@index');
        $router->post('/', 'ActivityController@store');
    });

    // Story category routes (super admin only)
    $router->group(['prefix' => 'story-categories'], function () use ($router) {
        $router->get('/', 'StoryCategoryController@index');
        $router->post('/', 'StoryCategoryController@store');
        $router->put('/{id}', 'StoryCategoryController@update');
        $router->delete('/{id}', 'StoryCategoryController@destroy');
        $router->get('/readers', 'StoryCategoryController@getReadersWithAccess');
        $router->get('/readers/{userId}', 'StoryCategoryController@getReaderCategories');
        $router->put('/readers/{userId}/access', 'StoryCategoryController@updateReaderAccess');
    });

    // Story routes
    $router->group(['prefix' => 'stories'], function () use ($router) {
        $router->get('/published', 'StoryController@getPublishedStories'); // Public endpoint
        $router->post('/', 'StoryController@store');
        $router->get('/pending', 'StoryController@getPendingStories');
        $router->get('/pending/count', 'StoryController@getPendingCount');
        $router->post('/{id}/approve', 'StoryController@approve');
        $router->post('/{id}/reject', 'StoryController@reject');
        $router->get('/reader/{userId}', 'StoryController@getReaderStories');
        $router->get('/approved/{adminId}', 'StoryController@getApprovedStories');
        $router->put('/{id}', 'StoryController@update');
        $router->delete('/{id}', 'StoryController@destroy');
    });
});

