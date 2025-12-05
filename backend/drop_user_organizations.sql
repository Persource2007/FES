-- Drop User Organizations Pivot Table
-- Run this SQL directly if the migration has issues with foreign key constraints

-- Drop foreign key constraints first (if they exist)
ALTER TABLE IF EXISTS user_organizations 
    DROP CONSTRAINT IF EXISTS user_organizations_user_id_foreign;

ALTER TABLE IF EXISTS user_organizations 
    DROP CONSTRAINT IF EXISTS user_organizations_organization_id_foreign;

-- Drop indexes (if they exist)
DROP INDEX IF EXISTS user_organizations_user_id_index;
DROP INDEX IF EXISTS user_organizations_organization_id_index;
DROP INDEX IF EXISTS user_organizations_user_id_organization_id_unique;

-- Drop the table
DROP TABLE IF EXISTS user_organizations CASCADE;

