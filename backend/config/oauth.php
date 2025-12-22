<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OAuth Server Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the OAuth 2.0 server used for authentication.
    |
    */

    'server_url' => env('OAUTH_SERVER_URL', 'http://192.168.14.16:9090'),
    
    'client_id' => env('OAUTH_CLIENT_ID', 'commonstories'),
    
    'client_secret' => env('OAUTH_CLIENT_SECRET', 'a1a8ab04c6b245e7742a87c146d945f399139e85'),
    
    'redirect_uri' => env('OAUTH_REDIRECT_URI', 'https://geet.observatory.org.in'),
    
    'scope' => env('OAUTH_SCOPE', 'openid email profile'),
    
    /*
    |--------------------------------------------------------------------------
    | OAuth Endpoints
    |--------------------------------------------------------------------------
    */
    
    'authorize_url' => env('OAUTH_AUTHORIZE_URL', null), // Will default to {server_url}/oauth2/authorize
    
    'token_url' => env('OAUTH_TOKEN_URL', null), // Will default to {server_url}/oauth2/token
    
    'userinfo_url' => env('OAUTH_USERINFO_URL', null), // Will default to {server_url}/userinfo
];

