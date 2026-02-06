# Lab Dashboard

A full-stack lab equipment booking system for university environments. Students browse machines, request time slots, and track booking status. Faculty review and approve or reject requests in real time.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.94-3FCF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.31-0055FF?logo=framer&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Role-based access** -- Student, Faculty, and Admin roles with scoped views and permissions
- **Machine catalog** -- Browse, search, and filter lab equipment with real-time availability
- **Multi-step booking** -- Three-step form with date/time selection, purpose entry, and confirmation
- **Faculty approval** -- Approve or reject booking requests with comments; real-time updates via Supabase Realtime
- **My Bookings** -- Tab-filtered view (All / Pending / Approved / Rejected / Past) with cancel and detail modals
- **Admin panel** -- Machine CRUD management and booking oversight
- **Conflict detection** -- Server-side RPC checks for overlapping bookings before insert
- **Responsive design** -- Sidebar layout on desktop, slide-out nav on mobile
- **Animated UI** -- Page transitions and micro-interactions powered by Framer Motion
- **Toast notifications** -- Instant feedback for all user actions via Sonner

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 with Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Backend / Auth | Supabase (Postgres, Auth, Realtime) |
| Routing | React Router v7 |
| Animations | Framer Motion |
| Date Handling | date-fns |
| Notifications | Sonner |
| Deployment | Vercel |

---

## Project Structure

```
src/
  components/
    admin/          -- MachineManager (CRUD)
    bookings/       -- BookingForm, BookingModal
    dashboard/      -- StudentDashboard, FacultyDashboard
    layouts/        -- DashboardLayout (sidebar + mobile nav)
    machines/       -- MachineCard, MachineDetailsModal
    ui/             -- shadcn/ui primitives (button, card, dialog, ...)
  hooks/
    useAuth.js      -- Auth state, profile, sign-in/out helpers
  lib/
    supabase.js     -- Supabase client initialization
    utils.js        -- cn() utility (clsx + tailwind-merge)
  pages/
    LoginPage.jsx
    SignupPage.jsx
    Dashboard.jsx   -- Routes to Student or Faculty dashboard by role
    MachinesPage.jsx
    BookingsPage.jsx
    AdminDashboard.jsx
  services/
    authService.js
    bookingService.js
    machineService.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

### Installation

```bash
git clone https://github.com/<your-org>/lab-dashboard.git
cd lab-dashboard
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Setup

Run the contents of `supabase_schema.sql` in the Supabase SQL editor. This creates all tables, RLS policies, functions, triggers, and indexes.

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production Build

```bash
npm run build
npm run preview
```

---

## Deployment

### Deploying to Vercel

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect the Vite configuration

3. **Set Environment Variables** (CRITICAL)
   - In Vercel Dashboard → Project Settings → Environment Variables
   - Add these two required variables:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Set for all environments (Production, Preview, Development)

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-project.vercel.app`

The project uses `vercel.json` for SPA routing to ensure all routes redirect to `index.html`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Note**: The build uses a custom `vercel-build` script to skip linting during deployment, ensuring faster builds.

---

## Database Schema

Four tables with Row Level Security:

- **profiles** -- Extends `auth.users` with role, department, and contact info
- **machines** -- Lab equipment with name, location, specs (JSONB), and active flag
- **bookings** -- Links students to machines with date, time, purpose, and status
- **booking_rules** -- Per-machine constraints (max duration, allowed hours, blackout dates)

Key policies:

- Students can view and cancel their own bookings
- Faculty and admins can view and update all bookings
- A Postgres trigger automatically creates a profile row on signup
- An RPC function (`check_booking_conflict`) validates time-slot availability

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run vercel-build` | Build for Vercel deployment (skips linting) |

---

## License

MIT
