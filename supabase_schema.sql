-- 1. Create Profiles table (Links to Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role text check (role in ('student', 'faculty')) default 'student',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Equipment table
create table equipment (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category text,
  image_url text,
  is_under_maintenance boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Bookings table
create table bookings (
  id uuid default gen_random_uuid() primary key,
  equipment_id uuid references equipment(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  denial_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ENABLE RLS
alter table profiles enable row level security;
alter table equipment enable row level security;
alter table bookings enable row level security;

-- POLICIES
-- Profiles: Users can read all profiles but only update their own
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Equipment: Everyone can view, only Faculty can insert/update
create policy "Equipment viewable by everyone" on equipment for select using (true);
create policy "Faculty can manage equipment" on equipment for all 
  using (exists (select 1 from profiles where id = auth.uid() and role = 'faculty'));

-- Bookings: Students manage own, Faculty manage all
create policy "Users can view own bookings" on bookings for select 
  using (auth.uid() = student_id or exists (select 1 from profiles where id = auth.uid() and role = 'faculty'));

create policy "Students can insert own bookings" on bookings for insert 
  with check (auth.uid() = student_id);

create policy "Faculty can update booking status" on bookings for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'faculty'));

-- REALTIME
-- Enable realtime for bookings and equipment (requires publication update)
-- Note: You may need to enable replication on the table settings in Supabase Dashboard too if this fails.
begin;
  -- Try to add tables to the publication. If publication exists, alter it.
  -- This PL/pgSQL block handles the existence check implicitly or we just run the alter.
  -- Simpler for SQL editor:
end;

alter publication supabase_realtime add table bookings, equipment;

-- TRIGGERS
-- Handle new user signup -> Create Profile automatically
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'student');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
