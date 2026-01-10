-- Create meeting_registrants table to store Zoom registration info
CREATE TABLE IF NOT EXISTS meeting_registrants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES zoom_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zoom_registrant_id TEXT,
  join_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Add registration_url column to zoom_meetings
ALTER TABLE zoom_meetings ADD COLUMN IF NOT EXISTS registration_url TEXT;
ALTER TABLE zoom_meetings ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE meeting_registrants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meeting_registrants
CREATE POLICY "Users can view their own registrations"
  ON meeting_registrants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all registrations"
  ON meeting_registrants FOR SELECT
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Teachers can view registrations for their meetings"
  ON meeting_registrants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM zoom_meetings zm
      WHERE zm.id = meeting_registrants.meeting_id
      AND zm.host_id = auth.uid()
    )
  );

CREATE POLICY "System can insert registrations"
  ON meeting_registrants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update registrations"
  ON meeting_registrants FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_registrants_meeting ON meeting_registrants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_registrants_user ON meeting_registrants(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_registrants_status ON meeting_registrants(status);
