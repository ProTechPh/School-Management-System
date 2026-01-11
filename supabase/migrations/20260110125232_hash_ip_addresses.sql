-- Migration: Replace ip_address with ip_hash for privacy
-- This stores hashed IP addresses instead of raw IPs to protect user privacy
-- while still allowing abuse detection via hash comparison

-- Add new ip_hash column
ALTER TABLE qr_checkins ADD COLUMN IF NOT EXISTS ip_hash VARCHAR(64);

-- Create index for efficient lookups on hashed IPs
CREATE INDEX IF NOT EXISTS idx_qr_checkins_ip_hash ON qr_checkins(ip_hash);

-- Comment explaining the column
COMMENT ON COLUMN qr_checkins.ip_hash IS 'SHA-256 hash of client IP address (first 32 chars) for privacy-preserving abuse detection';;
