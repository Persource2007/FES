-- Create story_categories table
CREATE TABLE IF NOT EXISTS story_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reader_category_access table (junction table for reader permissions)
CREATE TABLE IF NOT EXISTS reader_category_access (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id),
    CONSTRAINT fk_reader_category_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_reader_category_category_id 
        FOREIGN KEY (category_id) 
        REFERENCES story_categories(id) 
        ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_story_categories_name ON story_categories(name);
CREATE INDEX IF NOT EXISTS idx_story_categories_is_active ON story_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_reader_category_access_user_id ON reader_category_access(user_id);
CREATE INDEX IF NOT EXISTS idx_reader_category_access_category_id ON reader_category_access(category_id);

-- Grant permissions to vyom user
GRANT ALL PRIVILEGES ON TABLE story_categories TO vyom;
GRANT ALL PRIVILEGES ON TABLE reader_category_access TO vyom;
GRANT USAGE, SELECT ON SEQUENCE story_categories_id_seq TO vyom;
GRANT USAGE, SELECT ON SEQUENCE reader_category_access_id_seq TO vyom;

