-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  max_score INTEGER DEFAULT 100,
  allow_late_submission BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment attachments table
CREATE TABLE IF NOT EXISTS assignment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('pdf', 'document', 'image', 'link')),
  url TEXT NOT NULL,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'submitted' CHECK (status IN ('pending', 'submitted', 'graded', 'late')),
  comment TEXT,
  score INTEGER,
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(assignment_id, student_id)
);

-- Create submission files table
CREATE TABLE IF NOT EXISTS submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  url TEXT NOT NULL,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Teachers can manage their assignments" ON assignments
  FOR ALL USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students can view published assignments for their classes" ON assignments
  FOR SELECT USING (
    status = 'published' AND 
    EXISTS (
      SELECT 1 FROM class_students cs 
      WHERE cs.class_id = assignments.class_id AND cs.student_id = auth.uid()
    )
  );

-- Assignment attachments policies
CREATE POLICY "Anyone can view assignment attachments" ON assignment_attachments
  FOR SELECT USING (true);

CREATE POLICY "Teachers can manage attachments" ON assignment_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.id = assignment_attachments.assignment_id 
      AND (a.teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Submissions policies
CREATE POLICY "Students can submit and view their own submissions" ON assignment_submissions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view and grade submissions for their assignments" ON assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assignments a 
      WHERE a.id = assignment_submissions.assignment_id 
      AND (a.teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- Submission files policies
CREATE POLICY "Users can view their own submission files" ON submission_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignment_submissions s 
      WHERE s.id = submission_files.submission_id 
      AND (s.student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM assignments a WHERE a.id = s.assignment_id AND a.teacher_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Students can upload submission files" ON submission_files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignment_submissions s 
      WHERE s.id = submission_files.submission_id AND s.student_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON assignment_submissions(student_id);;
