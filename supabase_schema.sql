-- ============================================================
-- Lab Dashboard - Supabase Schema
-- ============================================================
-- Tables: profiles, machines, bookings, booking_rules
-- Features: RLS, conflict-check RPC, auto-profile trigger,
--           realtime publication, performance indexes
-- ============================================================

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'faculty', 'admin')) DEFAULT 'student',
  department TEXT,
  phone TEXT,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- ============================================================
-- Indexes for query performance
-- ============================================================
CREATE INDEX idx_bookings_student ON bookings (student_id);
CREATE INDEX idx_bookings_machine_date ON bookings (machine_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_created_at ON bookings (created_at DESC);
CREATE INDEX idx_machines_active ON machines (is_active);
CREATE INDEX idx_profiles_role ON profiles (role);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;

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
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
  );

CREATE POLICY "Only faculty/admin can manage machines"
  ON machines FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
  );

CREATE POLICY "Only faculty/admin can update machines"
  ON machines FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
  );

CREATE POLICY "Only faculty/admin can delete machines"
  ON machines FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
  );

-- Policies for bookings
CREATE POLICY "Students view own bookings"
  ON bookings FOR SELECT USING (
    student_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
  );

CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT WITH CHECK (
    student_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
  );

CREATE POLICY "Students can cancel own bookings"
  ON bookings FOR UPDATE USING (
    student_id = auth.uid() AND
    status IN ('pending', 'approved')
  ) WITH CHECK (
    status = 'cancelled'
  );

CREATE POLICY "Faculty can update any booking"
  ON bookings FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
  );

-- Policies for booking_rules
CREATE POLICY "Anyone can view booking rules"
  ON booking_rules FOR SELECT USING (true);

CREATE POLICY "Faculty can manage booking rules"
  ON booking_rules FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
  );

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
  RETURN NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE machine_id = p_machine_id
    AND booking_date = p_date
    AND status IN ('pending', 'approved')
    AND (
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    )
  );
END;
$$ LANGUAGE plpgsql;

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

-- ============================================================
-- Auth trigger: create profile on user signup
-- Reads role and department from auth metadata when available
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'department', NULL)
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
