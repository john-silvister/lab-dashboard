LabEquip: Solo Developer Blueprint

This document outlines the full implementation strategy for a minimalist Lab Equipment Booking System using **React** and **Supabase**.

## 1. Database Schema (Supabase SQL)

Run this in your Supabase SQL Editor to set up the tables and Row Level Security (RLS).

```sql
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

```

---

## 2. Core Logic: The Overlap Formula

To prevent double-booking, your frontend and a database function should check that no approved booking exists where:

---

## 3. Project Folder Structure (React)

```text
src/
├── components/
│   ├── ui/             # Shadcn components (Button, Card, Dialog)
│   ├── EquipmentCard.jsx
│   ├── BookingModal.jsx
│   └── Navbar.jsx
├── hooks/
│   └── useAuth.js      # Listen for Supabase auth changes
├── lib/
│   └── supabase.js     # Supabase client init
├── pages/
│   ├── Dashboard.jsx   # Student View
│   ├── AdminPanel.jsx  # Faculty View
│   └── Login.jsx
└── App.jsx

```

---

## 4. UI/UX "Delight" Checklist

To keep the interface clean and professional:

* **Color Palette:** White (), Light Gray () for backgrounds, and one primary brand color (e.g., Indigo ).
* **Shadcn/ui Components:** Use `Calendar`, `Badge`, `Toast`, and `Dialog`.
* **Micro-interactions (Framer Motion):**
* Hover effect: Scale cards by `1.02`.
* List transitions: Use `<AnimatePresence>` when a faculty member approves a request so it slides out smoothly.


* **Real-time:** Subscribe to `bookings` table changes. Use `sonner` for toast notifications:
```javascript
// Example: Notify student when status changes
supabase
  .channel('schema-db-changes')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, 
  payload => {
    toast.success(`Your booking is now ${payload.new.status}!`)
  })
  .subscribe()

```



---

## 5. Development Roadmap (The Solo Sprint)

### Step 1: Data & Auth (2 Days)

* Set up Supabase project.
* Run the SQL provided above.
* Build a simple Login/Signup page using `supabase.auth`.

### Step 2: The Browsing Experience (3 Days)

* Create the `EquipmentCard`.
* Fetch data using `useEffect` or `TanStack Query`.
* Implement a search bar to filter equipment by name.

### Step 3: The Booking Flow (3 Days)

* Implement the `BookingModal`.
* Add a Date Picker and a selection for 1-hour time blocks.
* Add logic to prevent selecting past dates.

### Step 4: The Faculty Dashboard (3 Days)

* Create a table view for "Pending Requests."
* Add "Approve" and "Reject" buttons.
* Add a "Denial Reason" text field that only appears if "Reject" is clicked.

### Step 5: Polish (2 Days)

* Add loading skeletons.
* Add empty state illustrations.
* Deploy to **Vercel**.

---