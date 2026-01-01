-- Add DepEd-required fields to student_profiles table
ALTER TABLE student_profiles
  -- Basic Info
  ADD COLUMN IF NOT EXISTS lrn VARCHAR(12),
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS name_extension VARCHAR(10),
  ADD COLUMN IF NOT EXISTS birthdate DATE,
  ADD COLUMN IF NOT EXISTS sex VARCHAR(10),
  ADD COLUMN IF NOT EXISTS birthplace_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS birthplace_province VARCHAR(100),
  
  -- Contact/Address
  ADD COLUMN IF NOT EXISTS current_house_street VARCHAR(255),
  ADD COLUMN IF NOT EXISTS current_barangay VARCHAR(100),
  ADD COLUMN IF NOT EXISTS current_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS current_province VARCHAR(100),
  ADD COLUMN IF NOT EXISTS current_region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS permanent_same_as_current BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS permanent_house_street VARCHAR(255),
  ADD COLUMN IF NOT EXISTS permanent_barangay VARCHAR(100),
  ADD COLUMN IF NOT EXISTS permanent_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS permanent_province VARCHAR(100),
  ADD COLUMN IF NOT EXISTS permanent_region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  
  -- Parent/Guardian
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS father_contact VARCHAR(20),
  ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mother_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS mother_contact VARCHAR(20),
  ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(100),
  ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(50),
  ADD COLUMN IF NOT EXISTS guardian_contact VARCHAR(20),
  
  -- Academic
  ADD COLUMN IF NOT EXISTS school_year VARCHAR(20),
  ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS last_school_attended VARCHAR(200),
  ADD COLUMN IF NOT EXISTS last_school_year VARCHAR(20),
  ADD COLUMN IF NOT EXISTS track VARCHAR(50),
  ADD COLUMN IF NOT EXISTS strand VARCHAR(100),
  
  -- DepEd Required
  ADD COLUMN IF NOT EXISTS psa_birth_cert_no VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_4ps_beneficiary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS household_4ps_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_indigenous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS indigenous_group VARCHAR(100),
  ADD COLUMN IF NOT EXISTS mother_tongue VARCHAR(50),
  ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
  
  -- Health/Special Needs
  ADD COLUMN IF NOT EXISTS disability_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS disability_details TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS emergency_contact_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT;

-- Add check constraint for sex field
ALTER TABLE student_profiles
  DROP CONSTRAINT IF EXISTS student_profiles_sex_check;
ALTER TABLE student_profiles
  ADD CONSTRAINT student_profiles_sex_check CHECK (sex IS NULL OR sex IN ('Male', 'Female'));

-- Add check constraint for enrollment_status field
ALTER TABLE student_profiles
  DROP CONSTRAINT IF EXISTS student_profiles_enrollment_status_check;
ALTER TABLE student_profiles
  ADD CONSTRAINT student_profiles_enrollment_status_check CHECK (enrollment_status IS NULL OR enrollment_status IN ('New', 'Transferee', 'Balik-Aral', 'Cross-Enrollee'));

-- Add check constraint for track field
ALTER TABLE student_profiles
  DROP CONSTRAINT IF EXISTS student_profiles_track_check;
ALTER TABLE student_profiles
  ADD CONSTRAINT student_profiles_track_check CHECK (track IS NULL OR track IN ('Academic', 'TVL', 'Sports', 'Arts and Design'));

-- Add unique constraint for LRN (if not null)
CREATE UNIQUE INDEX IF NOT EXISTS student_profiles_lrn_unique ON student_profiles (lrn) WHERE lrn IS NOT NULL;

-- Add comment for documentation
COMMENT ON TABLE student_profiles IS 'Extended student profile with DepEd-required fields for Learner Information System (LIS) compliance';;
