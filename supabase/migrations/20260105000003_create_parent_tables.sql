-- Add parent role to users
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'teacher', 'student', 'parent'));

-- Create parent-child relationship table
CREATE TABLE IF NOT EXISTS parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT DEFAULT 'guardian' CHECK (relationship IN ('mother', 'father', 'guardian', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Enable RLS
ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

-- Policies for parent-child relationships
CREATE POLICY "Parents can view their own children" ON parent_children
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Admin can manage all parent-child relationships" ON parent_children
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Allow parents to view their children's data
CREATE POLICY "Parents can view their children's grades" ON grades
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_children pc 
      WHERE pc.parent_id = auth.uid() AND pc.student_id = grades.student_id
    )
  );

CREATE POLICY "Parents can view their children's attendance" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_children pc 
      WHERE pc.parent_id = auth.uid() AND pc.student_id = attendance_records.student_id
    )
  );

CREATE POLICY "Parents can view their children's class enrollments" ON class_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_children pc 
      WHERE pc.parent_id = auth.uid() AND pc.student_id = class_students.student_id
    )
  );

-- Create index
CREATE INDEX idx_parent_children_parent_id ON parent_children(parent_id);
CREATE INDEX idx_parent_children_student_id ON parent_children(student_id);
