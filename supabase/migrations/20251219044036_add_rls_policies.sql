-- Allow users to read their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own data during registration
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Student profiles
CREATE POLICY "Users can read own student profile" ON student_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own student profile" ON student_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own student profile" ON student_profiles FOR UPDATE USING (auth.uid() = id);

-- Teacher profiles
CREATE POLICY "Users can read own teacher profile" ON teacher_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own teacher profile" ON teacher_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own teacher profile" ON teacher_profiles FOR UPDATE USING (auth.uid() = id);

-- School settings - everyone can read
CREATE POLICY "Anyone can read school settings" ON school_settings FOR SELECT USING (true);;
