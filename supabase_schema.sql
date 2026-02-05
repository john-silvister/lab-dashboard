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
  machine_id UUID REFERENCES machines(id),
  max_duration_hours INTEGER DEFAULT 2,
  advance_booking_days INTEGER DEFAULT 7,
  booking_start_hour TIME DEFAULT '09:00',
  booking_end_hour TIME DEFAULT '18:00',
  blackout_dates DATE[]
);

-- ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for machines
CREATE POLICY "Anyone can view active machines" ON machines FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can manage machines" ON machines FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Policies for bookings
CREATE POLICY "Students view own bookings" ON bookings FOR SELECT USING (
  student_id = auth.uid() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
);
CREATE POLICY "Students can create bookings" ON bookings FOR INSERT WITH CHECK (
  student_id = auth.uid() AND 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'student'
);
CREATE POLICY "Faculty can update bookings" ON bookings FOR UPDATE USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
);

-- Policies for booking_rules
CREATE POLICY "Anyone can view booking rules" ON booking_rules FOR SELECT USING (true);
CREATE POLICY "Faculty can manage booking rules" ON booking_rules FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('faculty', 'admin')
);

-- Function to check booking conflicts
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

-- Handle new user signup -> Create Profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'student', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookings, machines;
