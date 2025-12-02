-- Verify Permissions Setup
-- Run this to check if permissions are correctly assigned

-- 1. Check if permissions table exists and has data
SELECT 'Permissions Table' as check_type, COUNT(*) as count FROM permissions;

-- 2. Check if role_permissions table exists and has data
SELECT 'Role Permissions Table' as check_type, COUNT(*) as count FROM role_permissions;

-- 3. Check Super admin permissions
SELECT 
    'Super Admin Permissions' as check_type,
    r.role_name,
    p.name as permission_name,
    p.slug as permission_slug
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.role_name = 'Super admin'
ORDER BY p.slug;

-- 4. Check if manage_users permission exists
SELECT 
    'Manage Users Permission' as check_type,
    id,
    name,
    slug
FROM permissions
WHERE slug = 'manage_users';

-- 5. Check if Super admin has manage_users permission
SELECT 
    'Super Admin Has Manage Users' as check_type,
    CASE 
        WHEN COUNT(*) > 0 THEN 'YES'
        ELSE 'NO'
    END as has_permission
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.role_name = 'Super admin'
  AND p.slug = 'manage_users';

