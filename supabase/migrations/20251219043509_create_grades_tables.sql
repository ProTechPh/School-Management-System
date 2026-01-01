CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL DEFAULT 100,
  percentage NUMERIC NOT NULL,
  grade NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('exam', 'quiz', 'assignment', 'project')),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grade_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  quiz_weight NUMERIC DEFAULT 30,
  exam_weight NUMERIC DEFAULT 35,
  assignment_weight NUMERIC DEFAULT 20,
  project_weight NUMERIC DEFAULT 15,
  UNIQUE(class_id)
);

CREATE TABLE grade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  school_year TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  general_average NUMERIC,
  remarks TEXT,
  promoted_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grade_history_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_history_id UUID REFERENCES grade_history(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  final_grade NUMERIC NOT NULL,
  remarks TEXT
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history_subjects ENABLE ROW LEVEL SECURITY;;
