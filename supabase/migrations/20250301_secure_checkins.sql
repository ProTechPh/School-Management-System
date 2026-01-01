ALTER TABLE qr_checkins ADD COLUMN IF NOT EXISTS ip_address TEXT;
CREATE INDEX IF NOT EXISTS idx_qr_checkins_ip ON qr_checkins(ip_address);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_created_at ON qr_checkins(created_at);