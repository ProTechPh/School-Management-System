-- Allow anon to insert student profiles during signup
CREATE POLICY "Allow signup insert" ON student_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to insert teacher profiles during signup  
CREATE POLICY "Allow signup insert" ON teacher_profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);;
