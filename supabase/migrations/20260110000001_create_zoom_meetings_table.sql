-- Create zoom_meetings table to store Zoom meeting data
CREATE TABLE IF NOT EXISTS zoom_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoom_meeting_id TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT DEFAULT 'scheduled' CHECK (meeting_type IN ('instant', 'scheduled', 'recurring')),
  start_time TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60, -- in minutes
  timezone TEXT DEFAULT 'UTC',
  join_url TEXT NOT NULL,
  start_url TEXT,
  password TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'started', 'ended', 'cancelled')),
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  target_audience TEXT DEFAULT 'class' CHECK (target_audience IN ('all', 'students', 'teachers', 'class', 'personal')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create zoom_participants table to track meeting attendance
CREATE TABLE IF NOT EXISTS zoom_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES zoom_meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  zoom_participant_id TEXT,
  name TEXT,
  email TEXT,
  join_time TIMESTAMPTZ,
  leave_time TIMESTAMPTZ,
  duration INTEGER, -- in seconds
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'left')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_zoom_meetings_host ON zoom_meetings(host_id);
CREATE INDEX idx_zoom_meetings_class ON zoom_meetings(class_id);
CREATE INDEX idx_zoom_meetings_start_time ON zoom_meetings(start_time);
CREATE INDEX idx_zoom_meetings_status ON zoom_meetings(status);
CREATE INDEX idx_zoom_participants_meeting ON zoom_participants(meeting_id);
CREATE INDEX idx_zoom_participants_user ON zoom_participants(user_id);

-- Enable RLS
ALTER TABLE zoom_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE zoom_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zoom_meetings
CREATE POLICY "Users can view meetings they have access to" ON zoom_meetings
  FOR SELECT USING (
    -- Host can see their meetings
    host_id = auth.uid()
    -- All meetings visible to everyone
    OR target_audience = 'all'
    -- Teacher meetings
    OR (target_audience = 'teachers' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'))
    -- Student meetings
    OR (target_audience = 'students' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student'))
    -- Class meetings - students enrolled or teacher of class
    OR (target_audience = 'class' AND class_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM class_students cs WHERE cs.class_id = zoom_meetings.class_id AND cs.student_id = auth.uid())
      OR EXISTS (SELECT 1 FROM classes c WHERE c.id = zoom_meetings.class_id AND c.teacher_id = auth.uid())
    ))
    -- Parents can see meetings for their children's classes
    OR (target_audience = 'class' AND class_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM parent_children pc
      JOIN class_students cs ON cs.student_id = pc.student_id
      WHERE pc.parent_id = auth.uid() AND cs.class_id = zoom_meetings.class_id
    ))
    -- Admin sees all
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Teachers and admins can create meetings" ON zoom_meetings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Host and admins can update meetings" ON zoom_meetings
  FOR UPDATE USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Host and admins can delete meetings" ON zoom_meetings
  FOR DELETE USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for zoom_participants
CREATE POLICY "Users can view participants for meetings they can access" ON zoom_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM zoom_meetings zm
      WHERE zm.id = zoom_participants.meeting_id
      AND (
        zm.host_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "System can insert participants" ON zoom_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update participants" ON zoom_participants
  FOR UPDATE USING (true);
