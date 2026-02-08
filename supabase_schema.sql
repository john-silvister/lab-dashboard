-- ============================================================
-- Lab Dashboard - Supabase Schema (Updated: 2026-02-07)
-- ============================================================
-- Tables: profiles, machines, bookings, booking_rules
-- Features: RLS, conflict-check RPC, auto-profile trigger,
--           realtime publication, performance indexes
-- ============================================================

-- 0. RESET: Drop existing tables to allow clean overwrite
DROP TABLE IF EXISTS audit_log, booking_rules, bookings, machines, profiles CASCADE;

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'faculty', 'admin')) DEFAULT 'student',
  department TEXT,
  phone TEXT,
  register_number TEXT,
  specialization TEXT,
  year_of_passout TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Machines table
CREATE TABLE machines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT,
  location TEXT,
  specifications JSONB,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_training BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  faculty_id UUID REFERENCES profiles(id),
  faculty_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_overlap UNIQUE (machine_id, booking_date, start_time)
);

-- 4. Booking rules table (for faculty to set constraints)
CREATE TABLE booking_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  max_duration_hours INTEGER DEFAULT 2,
  advance_booking_days INTEGER DEFAULT 7,
  booking_start_hour TIME DEFAULT '09:00',
  booking_end_hour TIME DEFAULT '18:00',
  blackout_dates DATE[]
);

-- 5. Audit log table for security monitoring
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes for query performance
-- ============================================================
CREATE INDEX idx_bookings_student ON bookings (student_id);
CREATE INDEX idx_bookings_machine_date ON bookings (machine_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_created_at ON bookings (created_at DESC);
CREATE INDEX idx_bookings_time_range ON bookings (machine_id, booking_date, start_time, end_time) WHERE status IN ('pending', 'approved');
CREATE INDEX idx_machines_active ON machines (is_active);
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_email ON profiles (email);

-- Audit log indexes
CREATE INDEX idx_audit_log_table_operation ON audit_log (table_name, operation);
CREATE INDEX idx_audit_log_changed_at ON audit_log (changed_at DESC);
CREATE INDEX idx_audit_log_changed_by ON audit_log (changed_by);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for machines
CREATE POLICY "Anyone can view active machines"
  ON machines FOR SELECT USING (is_active = true);

CREATE POLICY "Faculty can view all machines"
  ON machines FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('faculty', 'admin')
    )
  );

CREATE POLICY "Only faculty/admin can manage machines"
  ON machines FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('faculty', 'admin')
    )
  );

CREATE POLICY "Only faculty/admin can update machines"
  ON machines FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('faculty', 'admin')
    )
  );

CREATE POLICY "Only faculty/admin can delete machines"
  ON machines FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('faculty', 'admin')
    )
  );

-- Policies for bookings
CREATE POLICY "Students view own bookings"
  ON bookings FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('faculty', 'admin')
    )
  );

CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'student'
    )
  );

CREATE POLICY "Students can cancel own bookings"
  ON bookings FOR UPDATE USING (
    student_id = auth.uid() AND
    status IN ('pending', 'approved')
  ) WITH CHECK (
    status = 'cancelled' AND
    student_id = auth.uid()
  );

CREATE POLICY "Faculty can update any booking"
  ON bookings FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('faculty', 'admin')
    )
  );

-- Policies for booking_rules
CREATE POLICY "Anyone can view booking rules"
  ON booking_rules FOR SELECT USING (true);

CREATE POLICY "Faculty/admin can view audit logs"
  ON audit_log FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('faculty', 'admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT WITH CHECK (true);

-- ============================================================
-- Functions
-- ============================================================

-- Check for overlapping bookings on the same machine/date
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_machine_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check for any overlapping bookings that are approved or pending
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE machine_id = p_machine_id
    AND booking_date = p_date
    AND status IN ('pending', 'approved')
    AND (
      -- Check for time overlap: start_time < p_end_time AND end_time > p_start_time
      (start_time < p_end_time AND end_time > p_start_time)
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Validate booking data before insert/update
CREATE OR REPLACE FUNCTION validate_booking_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate required fields
  IF NEW.machine_id IS NULL OR NEW.student_id IS NULL OR NEW.booking_date IS NULL
     OR NEW.start_time IS NULL OR NEW.end_time IS NULL OR NEW.purpose IS NULL THEN
    RAISE EXCEPTION 'All booking fields are required';
  END IF;

  -- Validate date is not in the past
  IF NEW.booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot book for past dates';
  END IF;

  -- Validate time logic
  IF NEW.start_time >= NEW.end_time THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  -- Validate reasonable booking duration (max 8 hours)
  IF EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600 > 8 THEN
    RAISE EXCEPTION 'Booking duration cannot exceed 8 hours';
  END IF;

  -- Validate purpose length
  IF LENGTH(NEW.purpose) > 500 THEN
    RAISE EXCEPTION 'Purpose cannot exceed 500 characters';
  END IF;

  -- Check for booking conflicts
  IF NOT check_booking_conflict(NEW.machine_id, NEW.booking_date, NEW.start_time, NEW.end_time) THEN
    RAISE EXCEPTION 'Booking conflicts with existing reservation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate machine data before insert/update
CREATE OR REPLACE FUNCTION validate_machine_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate required fields
  IF NEW.name IS NULL OR NEW.department IS NULL THEN
    RAISE EXCEPTION 'Machine name and department are required';
  END IF;

  -- Validate field lengths
  IF LENGTH(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Machine name cannot exceed 200 characters';
  END IF;

  IF LENGTH(NEW.description) > 1000 THEN
    RAISE EXCEPTION 'Description cannot exceed 1000 characters';
  END IF;

  IF LENGTH(NEW.department) > 100 THEN
    RAISE EXCEPTION 'Department cannot exceed 100 characters';
  END IF;

  IF LENGTH(NEW.location) > 200 THEN
    RAISE EXCEPTION 'Location cannot exceed 200 characters';
  END IF;

  -- Validate image URL format if provided
  IF NEW.image_url IS NOT NULL AND NEW.image_url != '' THEN
    IF LENGTH(NEW.image_url) > 500 THEN
      RAISE EXCEPTION 'Image URL cannot exceed 500 characters';
    END IF;

    IF NOT (NEW.image_url LIKE 'http://%' OR NEW.image_url LIKE 'https://%') THEN
      RAISE EXCEPTION 'Image URL must start with http:// or https://';
    END IF;
  END IF;

  -- Validate specifications JSON
  IF NEW.specifications IS NOT NULL THEN
    -- Basic JSON validation (Supabase handles this, but we add extra check)
    BEGIN
      -- Try to parse JSON to ensure it's valid
      PERFORM NEW.specifications::json;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Specifications must be valid JSON';
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate profile data before insert/update
CREATE OR REPLACE FUNCTION validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email IS NULL OR NEW.email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF LENGTH(NEW.email) > 254 THEN
    RAISE EXCEPTION 'Email cannot exceed 254 characters';
  END IF;

  -- Basic email format validation
  IF NOT NEW.email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  -- Validate role
  IF NEW.role NOT IN ('student', 'faculty', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be student, faculty, or admin';
  END IF;

  -- Validate field lengths
  IF NEW.full_name IS NOT NULL AND LENGTH(NEW.full_name) > 100 THEN
    RAISE EXCEPTION 'Full name cannot exceed 100 characters';
  END IF;

  IF NEW.phone IS NOT NULL AND LENGTH(NEW.phone) > 20 THEN
    RAISE EXCEPTION 'Phone cannot exceed 20 characters';
  END IF;

  IF NEW.register_number IS NOT NULL AND LENGTH(NEW.register_number) > 20 THEN
    RAISE EXCEPTION 'Register number cannot exceed 20 characters';
  END IF;

  IF NEW.specialization IS NOT NULL AND LENGTH(NEW.specialization) > 100 THEN
    RAISE EXCEPTION 'Specialization cannot exceed 100 characters';
  END IF;

  -- University email domain validation for students and faculty
  IF NEW.role = 'student' AND NOT NEW.email LIKE '%@btech.christuniversity.in' THEN
    RAISE EXCEPTION 'Students must use @btech.christuniversity.in email addresses';
  END IF;

  IF NEW.role = 'faculty' AND NOT (NEW.email LIKE '%@christuniversity.in' AND NEW.email NOT LIKE '%@btech.christuniversity.in') THEN
    RAISE EXCEPTION 'Faculty must use @christuniversity.in email addresses (not student subdomains)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit logging function
CREATE OR REPLACE FUNCTION audit_booking_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log significant booking changes
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, changed_by)
    VALUES ('bookings', 'INSERT', NEW.id, NULL, row_to_json(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if status changed or significant fields changed
    IF OLD.status != NEW.status OR OLD.faculty_id != NEW.faculty_id THEN
      INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, changed_by)
      VALUES ('bookings', 'UPDATE', NEW.id, row_to_json(OLD), row_to_json(NEW), auth.uid());
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, old_values, new_values, changed_by)
    VALUES ('bookings', 'DELETE', OLD.id, row_to_json(OLD), NULL, auth.uid());
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Validation triggers
CREATE TRIGGER validate_booking_before_insert_update
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION validate_booking_data();

CREATE TRIGGER validate_machine_before_insert_update
  BEFORE INSERT OR UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION validate_machine_data();

CREATE TRIGGER validate_profile_before_insert_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_data();

-- Audit triggers
CREATE TRIGGER audit_booking_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION audit_booking_changes();

-- ============================================================
-- Auth trigger: create profile on user signup
-- Reads role and department from auth metadata when available
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, department, phone, register_number, specialization, year_of_passout)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE 
      WHEN NEW.email IN ('ms.rishav@btech.christuniversity.in', 'msrishav28@gmail.com', 'ms.rishav289@gmail.com') THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    END,
    COALESCE(NEW.raw_user_meta_data->>'department', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'register_number', NULL),
    COALESCE(NEW.raw_user_meta_data->>'specialization', NULL),
    COALESCE(NEW.raw_user_meta_data->>'year_of_passout', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookings, machines;
