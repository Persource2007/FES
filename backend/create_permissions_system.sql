-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id),
    CONSTRAINT fk_role_permissions_role_id 
        FOREIGN KEY (role_id) 
        REFERENCES roles(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id 
        FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) 
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_permissions_slug ON permissions(slug);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Insert default permissions
INSERT INTO permissions (name, slug, description) VALUES
    ('Manage Users', 'manage_users', 'Create, edit, and delete users'),
    ('Manage Story Categories', 'manage_story_categories', 'Create, edit, and delete story categories'),
    ('Manage Reader Access', 'manage_reader_access', 'Assign category access to readers'),
    ('View Stories', 'view_stories', 'View and access stories'),
    ('Post Stories', 'post_stories', 'Create and post stories'),
    ('Manage Settings', 'manage_settings', 'Access and modify system settings'),
    ('View Activity', 'view_activity', 'View activity logs');

-- Grant permissions to Super admin role (using role name to find ID dynamically)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'Super admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant permissions to Reader role (using role name to find ID dynamically)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'Reader'
  AND p.slug IN ('view_stories', 'post_stories', 'view_activity')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant permissions to vyom user
GRANT ALL PRIVILEGES ON TABLE permissions TO vyom;
GRANT ALL PRIVILEGES ON TABLE role_permissions TO vyom;
GRANT USAGE, SELECT ON SEQUENCE permissions_id_seq TO vyom;
GRANT USAGE, SELECT ON SEQUENCE role_permissions_id_seq TO vyom;

