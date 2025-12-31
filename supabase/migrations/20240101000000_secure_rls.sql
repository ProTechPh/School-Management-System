-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- 1. Users Table Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Teachers can view students
CREATE POLICY "Teachers can view students" ON users
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'teacher') 
    AND role = 'student'
  );

-- 2. Student Profiles Policies
-- Students can view/edit their own profile
CREATE POLICY "Students view own profile" ON student_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students update own profile" ON student_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Teachers/Admins can view student profiles
CREATE POLICY "Staff view student profiles" ON student_profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'teacher'))
  );

-- 3. Grades Policies
-- Students can only view their own grades
CREATE POLICY "Students view own grades" ON grades
  FOR SELECT USING (student_id = auth.uid());

-- Teachers can view/manage grades for their classes
-- Note: This assumes a complex join or simplified check. 
-- For strictness, check if teacher teaches the class.
CREATE POLICY "Teachers manage grades" ON grades
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'teacher')
  );

-- 4. Attendance Policies
-- Students view own attendance
CREATE POLICY "Students view own attendance" ON attendance_records
  FOR SELECT USING (student_id = auth.uid());

-- Teachers manage attendance
CREATE POLICY "Teachers manage attendance" ON attendance_records
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'teacher')
  );