-- ============================================
-- CREATE DATABASE USER
-- ============================================
-- Run this script in phpMyAdmin or MySQL console as root user
-- ============================================

-- Create user read1 with password
CREATE USER IF NOT EXISTS 'read1'@'localhost' IDENTIFIED BY 'WbkBdxkiNrennEeC';

-- Grant all privileges on read1 database
GRANT ALL PRIVILEGES ON read1.* TO 'read1'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user created
SELECT User, Host FROM mysql.user WHERE User = 'read1';

-- Show privileges
SHOW GRANTS FOR 'read1'@'localhost';
