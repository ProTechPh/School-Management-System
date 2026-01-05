-- Create calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'other' CHECK (type IN ('class', 'quiz', 'assignment', 'exam', 'holiday', 'meeting', 'other')),
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  target_audience TEXT DEFAULT 'personal' CHECK (target_audience IN ('all', 'students', 'teachers', 'class', 'personal')),
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for calendar events
CREATE POLICY "Users can view events targeted to them" ON calendar_events
  FOR SELECT USING (
    -- Personal events
    (target_audience = 'personal' AND created_by = auth.uid())
    -- All events
    OR target_audience = 'all'
    -- Role-based events
    OR (target_audience = 'teachers' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'))
    OR (target_audience = 'students' AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student'))
    -- Class events
    OR (target_audience = 'class' AND class_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM class_students cs WHERE cs.class_id = calendar_events.class_id AND cs.student_id = auth.uid())
      OR EXISTS (SELECT 1 FROM classes c WHERE c.id = calendar_events.class_id AND c.teacher_id = auth.uid())
    ))
    -- Admin sees all
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create their own events" ON calendar_events
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events" ON calendar_events
  FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can delete their own events" ON calendar_events
  FOR DELETE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Create indexes
CREATE INDEX idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX idx_calendar_events_class_id ON calendar_events(class_id);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_calendar_events_target_audience ON calendar_events(target_audience);
