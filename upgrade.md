# Complete Solo Development Blueprint: Lab Booking System

## Phase 1: Planning & Setup (Week 1)

### Day 1-2: Project Foundation
**Define scope and requirements**  [netguru](https://www.netguru.com/blog/mvp-timeline):
- Write down exact user stories (student books machine, faculty approves/rejects, admin manages machines)
- Define MVP features vs future enhancements using MoSCoW method  [minimum-code](https://www.minimum-code.com/blog/mvp-development-process)
- Create simple wireframes on paper or Figma for all screens
- Estimate time per feature (be realistic for solo work)

**Initialize repositories**  [github](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Solo):
```bash
# Create GitHub repo with proper .gitignore
npx create-react-app lab-booking-client --template typescript
cd lab-booking-client
git init && git add . && git commit -m "Initial commit"
```

**Set up Supabase project**  [projectrules](https://www.projectrules.ai/rules/supabase):
- Create new Supabase project (note: API keys, database URL)
- Enable Email Auth in Authentication settings
- Create `.env.local` file with Supabase credentials

### Day 3-5: Database Design & Setup

**Create database schema**  [projectrules](https://www.projectrules.ai/rules/supabase):
```sql
-- Run these migrations in Supabase SQL editor

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'faculty', 'admin')),
  department TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
```

**Set up Row Level Security (RLS)**  [cursorrules](https://cursorrules.org/article/supabase-cursor-mdc-file):
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

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
```

**Create database functions for validation**  [projectrules](https://www.projectrules.ai/rules/supabase):
```sql
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
```

### Day 6-7: Project Structure Setup

**Organize frontend directory**  [projectrules](https://www.projectrules.ai/rules/supabase):
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Loader.tsx
│   ├── bookings/
│   │   ├── BookingCard.tsx
│   │   ├── BookingForm.tsx
│   │   └── BookingCalendar.tsx
│   ├── machines/
│   │   ├── MachineCard.tsx
│   │   └── MachineList.tsx
│   └── dashboard/
│       ├── StudentDashboard.tsx
│       └── FacultyDashboard.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── BookingsPage.tsx
│   └── MachinesPage.tsx
├── services/
│   ├── supabase.ts (client initialization)
│   ├── authService.ts
│   ├── bookingService.ts
│   └── machineService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useBookings.ts
│   └── useMachines.ts
├── utils/
│   ├── dateHelpers.ts
│   └── validators.ts
├── types/
│   └── index.ts
└── contexts/
    └── AuthContext.tsx
```

**Install dependencies**:
```bash
npm install @supabase/supabase-js
npm install react-router-dom react-query
npm install date-fns # for date handling
npm install react-big-calendar # or fullcalendar
npm install tailwindcss postcss autoprefixer
npm install react-hook-form zod # form validation
npm install react-hot-toast # notifications
```

## Phase 2: Backend Foundation (Week 2)

### Day 8-10: Supabase Services Layer

**Create Supabase client** (`src/services/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Build auth service** (`src/services/authService.ts`):
```typescript
export const authService = {
  signUp: async (email: string, password: string, metadata: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    // Also create profile entry
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        ...metadata
      });
    }
    return { data, error };
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getProfile: async (userId: string) => {
    return await supabase.from('profiles').select('*').eq('id', userId).single();
  }
};
```

**Build booking service** (`src/services/bookingService.ts`):
```typescript
export const bookingService = {
  createBooking: async (bookingData: BookingInput) => {
    return await supabase.from('bookings').insert(bookingData).select().single();
  },
  
  getMyBookings: async (userId: string) => {
    return await supabase
      .from('bookings')
      .select('*, machines(*)')
      .eq('student_id', userId)
      .order('booking_date', { ascending: true });
  },
  
  getPendingBookings: async () => {
    return await supabase
      .from('bookings')
      .select('*, machines(*), profiles!student_id(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
  },
  
  updateBookingStatus: async (bookingId: string, status: string, comments?: string) => {
    return await supabase
      .from('bookings')
      .update({ status, faculty_comments: comments, updated_at: new Date().toISOString() })
      .eq('id', bookingId);
  },
  
  // Real-time subscription for booking updates
  subscribeToBookings: (userId: string, callback: Function) => {
    return supabase
      .channel('booking-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `student_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
};
```

### Day 11-14: Core API Integration

**Create custom hooks**  [reddit](https://www.reddit.com/r/webdev/comments/n5cmnw/as_a_solo_fullstack_developer_whats_your_workflow/):
```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, profile, isAuthenticated: !!user };
};
```

## Phase 3: Frontend Development (Week 3-4)

### Week 3: Authentication & Basic UI

**Day 15-17: Auth flow**  [reddit](https://www.reddit.com/r/webdev/comments/n5cmnw/as_a_solo_fullstack_developer_whats_your_workflow/):
- Build LoginForm and SignupForm components
- Implement role selection during signup (student/faculty)
- Create protected route wrapper using React Router
- Build AuthContext for global auth state
- Test complete auth flow

**Day 18-21: Design system**  [reddit](https://www.reddit.com/r/web_design/comments/n5cn6y/as_a_solo_fullstack_developer_whats_your_workflow/):
- Create reusable components (Button, Input, Card, Modal)
- Set up Tailwind config with custom colors
- Build layout components (Header, Sidebar, Container)
- Create role-based navigation

### Week 4: Core Features

**Day 22-25: Student booking flow**  [linkedin](https://www.linkedin.com/posts/asad-omer_fullstack-webdevelopment-react-activity-7372490043476742145-ZAlw):
- Build MachineList component with filtering
- Create BookingCalendar showing availability
- Implement BookingForm with validation (date, time, purpose)
- Build "My Bookings" view with status badges
- Add booking cancellation functionality

**Day 26-28: Faculty approval flow**:
- Build PendingBookings dashboard
- Create approval modal with approve/reject actions
- Add faculty comments textarea
- Implement real-time updates when bookings change
- Build booking history view

## Phase 4: Advanced Features (Week 5)

### Day 29-31: Real-time & Notifications

**Set up real-time subscriptions**  [projectrules](https://www.projectrules.ai/rules/supabase):
```typescript
useEffect(() => {
  const subscription = bookingService.subscribeToBookings(
    user.id,
    (payload) => {
      toast.success('Booking status updated!');
      refetchBookings();
    }
  );
  
  return () => {
    supabase.removeChannel(subscription);
  };
}, [user.id]);
```

**Add toast notifications**:
- Success/error toasts for all actions
- Real-time notification when booking approved/rejected

### Day 32-35: Admin Features & Polish

**Admin dashboard**:
- Machine CRUD operations
- User management (view all users, change roles)
- Booking analytics (most used machines, peak hours)
- Booking rules configuration per machine

**UI polish**:
- Loading skeletons
- Empty states with helpful messages
- Error boundaries
- Mobile responsive design (test on Chrome DevTools)

## Phase 5: Testing & Optimization (Week 6)

### Day 36-38: Testing  [github](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Solo)

**Manual testing checklist**:
- [ ] Complete signup/login flow for each role
- [ ] Create booking with conflicts (should fail)
- [ ] Approve/reject bookings as faculty
- [ ] Real-time updates working
- [ ] Mobile responsiveness
- [ ] Edge cases (past dates, invalid times)

**Performance optimization**  [projectrules](https://www.projectrules.ai/rules/supabase):
- Enable React.memo for heavy components
- Lazy load routes with React.lazy
- Optimize Supabase queries (use select with specific columns)
- Add pagination for booking lists

### Day 39-42: Deployment  [github](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Solo)

**Frontend deployment (Vercel)**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment setup**:
- Set environment variables in Vercel dashboard
- Configure custom domain if available
- Set up preview deployments for testing

**Database finalization**  [projectrules](https://www.projectrules.ai/rules/supabase):
- Review RLS policies in production
- Create database backups in Supabase dashboard
- Set up monitoring (Supabase has built-in analytics)

## Phase 6: Launch & Iteration (Week 7+)

### Day 43-45: Soft Launch

**Deploy to test users**:
- Start with 10-15 students and 2-3 faculty
- Create onboarding guide (PDF or video)
- Set up feedback form (Google Forms or Typeform)

**Monitor issues**:
- Check Supabase logs daily
- Track user feedback in Notion/Trello
- Fix critical bugs immediately

### Day 46+: Iterate Based on Feedback  [netguru](https://www.netguru.com/blog/mvp-timeline)

**Common enhancement requests**:
- Email notifications (use Supabase Edge Functions + SendGrid)
- Recurring bookings for lab sessions
- Export booking reports (CSV download)
- Machine usage analytics dashboard
- QR code check-in system

## Solo Developer Workflow Tips  [reddit](https://www.reddit.com/r/webdev/comments/n5cmnw/as_a_solo_fullstack_developer_whats_your_workflow/)

**Daily routine**:
1. Morning (2-3 hours): Deep work on complex features (database logic, complex UI)
2. Afternoon (1-2 hours): Testing, bug fixes, smaller tasks
3. Evening (1 hour): Documentation, planning next day

**Productivity hacks**  [linkedin](https://www.linkedin.com/posts/liam-du_here-is-my-favorite-fullstack-engineering-activity-7371236940899049472-nzXT):
- Use dual monitors or split screen (code left, browser right)
- Keep Supabase dashboard open for quick DB checks
- Use React DevTools for debugging
- Commit frequently with clear messages
- Take breaks every 90 minutes  [github](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Solo)

**When stuck**  [github](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Solo):
- Check Supabase documentation first
- Search GitHub issues for similar problems
- Use Claude/ChatGPT for code review
- Don't spend >30 min on one bug (move on, come back later)

## Essential Tools & Resources

**Development**:
- VS Code with ESLint, Prettier, Tailwind IntelliSense
- Postman or Thunder Client for API testing
- React Developer Tools
- Git with proper .gitignore

**Design**:
- Figma for wireframes (free tier)
- Heroicons or Lucide for icons
- Tailwind UI for inspiration (free components)

**Project management**  [github](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Solo):
- GitHub Projects for task tracking
- Notion for documentation
- Google Calendar for time blocking

This blueprint gives you a clear 6-7 week roadmap to ship an MVP as a solo developer  [netguru](https://www.netguru.com/blog/mvp-timeline). Focus on completing Phase 1-4 first before adding advanced features  [minimum-code](https://www.minimum-code.com/blog/mvp-development-process).