# API Documentation

This directory contains the OpenAPI/Swagger specification for the FES Stories API.

## Files

- `swagger.yaml` - OpenAPI 3.0.3 specification file

## Viewing the Documentation

### Option 1: Swagger UI (Recommended)

1. **Install Swagger UI globally:**
   ```bash
   npm install -g swagger-ui-watcher
   ```

2. **Run Swagger UI:**
   ```bash
   cd backend/api-docs
   swagger-ui-watcher swagger.yaml
   ```

   Or use npx:
   ```bash
   npx swagger-ui-watcher backend/api-docs/swagger.yaml
   ```

3. **Access the UI:**
   - Open your browser to `http://localhost:3001` (or the port shown)

### Option 2: Online Swagger Editor

1. Go to [editor.swagger.io](https://editor.swagger.io/)
2. Click "File" → "Import file"
3. Upload `backend/api-docs/swagger.yaml`
4. View and test the API documentation

### Option 3: Postman

1. Open Postman
2. Click "Import"
3. Select "File" tab
4. Upload `backend/api-docs/swagger.yaml`
5. Postman will create a collection with all endpoints

### Option 4: VS Code Extension

1. Install "Swagger Viewer" extension in VS Code
2. Open `swagger.yaml`
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Swagger: Preview" and select it

## Testing the API

### Using Swagger UI

1. Start Swagger UI (see Option 1 above)
2. Click "Try it out" on any endpoint
3. Fill in the request parameters
4. Click "Execute"
5. View the response

### Using cURL

**Health Check:**
```bash
curl -X GET http://localhost:8000/api/health
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vyom@example.com","password":"123"}'
```

### Using PowerShell

**Health Check:**
```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/health -UseBasicParsing
```

**Login:**
```powershell
$body = @{
    email = "vyom@example.com"
    password = "123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

## Updating the Documentation

When adding new endpoints:

1. Open `swagger.yaml`
2. Add the new endpoint under `paths:`
3. Define request/response schemas in `components/schemas:`
4. Add examples if needed
5. Update this README if needed

### Example: Adding a New Endpoint

```yaml
paths:
  /api/users:
    get:
      tags:
        - Users
      summary: Get all users
      operationId: getUsers
      responses:
        '200':
          description: List of users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

## Current Endpoints

- `GET /api/health` - Health check and database status
- `POST /api/auth/login` - User authentication

## Test Credentials

- **Email:** `vyom@example.com`, **Password:** `123`
- **Email:** `krina@example.com`, **Password:** `123`

## Notes

- All endpoints are currently unauthenticated
- Authentication will be added for protected endpoints in the future
- The API base URL is `http://localhost:8000` for development
- CORS is configured to allow requests from `http://localhost:3000`

