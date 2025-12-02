-- Grant permissions to vyom user
\c fes_stories

-- Grant all privileges on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vyom;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vyom;

-- Grant privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vyom;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vyom;

-- Insert test users (using plain text password for now - Laravel will hash it)
INSERT INTO users (name, email, password) VALUES 
('Vyom', 'vyom@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'), -- password: 123
('Krina', 'krina@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')  -- password: 123
ON CONFLICT (email) DO NOTHING;

-- Verify users were inserted
SELECT id, name, email, created_at FROM users ORDER BY id;

