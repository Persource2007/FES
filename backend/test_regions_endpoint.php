<?php
/**
 * Quick test script for regions endpoint
 * Run: php test_regions_endpoint.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

// Test the endpoint
$request = \Illuminate\Http\Request::create('/api/regions', 'GET');
$response = $app->handle($request);

echo "Status Code: " . $response->getStatusCode() . "\n";
echo "Response: " . $response->getContent() . "\n";

