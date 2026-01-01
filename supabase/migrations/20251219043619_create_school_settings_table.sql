CREATE TABLE school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'LessonGo School',
  latitude NUMERIC,
  longitude NUMERIC,
  radius_meters INTEGER DEFAULT 500,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO school_settings (name, latitude, longitude, radius_meters) VALUES ('LessonGo School Campus', 14.5995, 120.9842, 500);

ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;;
