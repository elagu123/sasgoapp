-- SASGOAPP PostgreSQL Initialization Script

-- Create additional databases for different environments
CREATE DATABASE sasgoapp_staging OWNER sasgouser;
CREATE DATABASE sasgoapp_test OWNER sasgouser;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE sasgoapp TO sasgouser;
GRANT ALL PRIVILEGES ON DATABASE sasgoapp_staging TO sasgouser;
GRANT ALL PRIVILEGES ON DATABASE sasgoapp_test TO sasgouser;

-- Create read-only user for monitoring/backup
CREATE USER readonly_user WITH ENCRYPTED PASSWORD 'readonly_secure_password';
GRANT CONNECT ON DATABASE sasgoapp TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;