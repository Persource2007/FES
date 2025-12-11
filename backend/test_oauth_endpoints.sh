#!/bin/bash

# BFF OAuth Endpoints Test Script
# Usage: ./test_oauth_endpoints.sh

BASE_URL="http://localhost:8000"
COOKIE_FILE="test_cookies.txt"

echo "=== BFF OAuth Endpoints Test ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed (HTTP $HEALTH)${NC}"
fi
echo ""

# Test 2: OAuth callback (will fail without valid code, but tests endpoint exists)
echo "2. Testing OAuth callback endpoint (expecting 400 - missing params)..."
CALLBACK=$(curl -s -X POST "$BASE_URL/api/auth/oauth/callback" \
    -H "Content-Type: application/json" \
    -d '{}' \
    -w "\nHTTP_CODE:%{http_code}")
HTTP_CODE=$(echo "$CALLBACK" | grep -oP 'HTTP_CODE:\K[0-9]+')
if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✅ OAuth callback endpoint exists (correctly rejects invalid request)${NC}"
else
    echo -e "${YELLOW}⚠️  OAuth callback returned HTTP $HTTP_CODE (expected 400)${NC}"
fi
echo ""

# Test 3: Get current user (without session - should fail)
echo "3. Testing /auth/me without session (expecting 401)..."
ME=$(curl -s -X GET "$BASE_URL/api/auth/me" \
    -w "\nHTTP_CODE:%{http_code}")
HTTP_CODE=$(echo "$ME" | grep -oP 'HTTP_CODE:\K[0-9]+')
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ /auth/me correctly rejects unauthenticated requests${NC}"
else
    echo -e "${YELLOW}⚠️  /auth/me returned HTTP $HTTP_CODE (expected 401)${NC}"
fi
echo ""

# Test 4: Protected route without session
echo "4. Testing protected route without session (expecting 401)..."
ORGS=$(curl -s -X GET "$BASE_URL/api/organizations" \
    -w "\nHTTP_CODE:%{http_code}")
HTTP_CODE=$(echo "$ORGS" | grep -oP 'HTTP_CODE:\K[0-9]+')
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ Protected routes correctly reject unauthenticated requests${NC}"
else
    echo -e "${YELLOW}⚠️  Protected route returned HTTP $HTTP_CODE (expected 401)${NC}"
fi
echo ""

# Test 5: Public route (should work)
echo "5. Testing public route (regions)..."
REGIONS=$(curl -s -X GET "$BASE_URL/api/regions" \
    -w "\nHTTP_CODE:%{http_code}")
HTTP_CODE=$(echo "$REGIONS" | grep -oP 'HTTP_CODE:\K[0-9]+')
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Public routes work without authentication${NC}"
else
    echo -e "${YELLOW}⚠️  Public route returned HTTP $HTTP_CODE (expected 200)${NC}"
fi
echo ""

echo "=== Test Summary ==="
echo "Note: Full OAuth flow testing requires:"
echo "  1. Valid authorization code from OAuth server"
echo "  2. Matching code verifier"
echo "  3. User must exist in database with role"
echo ""
echo "For complete testing, use the frontend or Postman with actual OAuth credentials."

