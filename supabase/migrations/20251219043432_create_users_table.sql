CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  section TEXT NOT NULL,
  enrollment_date DATE,
  parent_name TEXT,
  parent_phone TEXT
);

CREATE TABLE teacher_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  department TEXT,
  join_date DATE
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;;
