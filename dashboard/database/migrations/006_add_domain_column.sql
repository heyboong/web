-- Add domain column to websites table
ALTER TABLE websites ADD COLUMN domain VARCHAR(255) DEFAULT NULL AFTER language;

-- Add index for domain column for better performance
CREATE INDEX idx_websites_domain ON websites(domain);
