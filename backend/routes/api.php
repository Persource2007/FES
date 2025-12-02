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
});

