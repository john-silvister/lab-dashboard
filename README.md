# Lab Dashboard

A full-stack lab equipment booking system for university environments. Students browse machines, request time slots, and track booking status. Faculty review, approve, and reject requests with Firebase realtime updates.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.31-0055FF?logo=framer&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

- **Role-based access** -- Student, Faculty, and Admin roles with scoped views and permissions
- **Machine catalog** -- Browse, search, and filter lab equipment with live availability
- **Multi-step booking** -- Three-step form with date/time selection, purpose entry, and confirmation
- **Faculty approval** -- Approve or reject booking requests with comments and Firebase realtime updates
- **My Bookings** -- Tab-filtered view (All / Pending / Approved / Rejected / Past) with cancel and detail modals
- **Admin panel** -- Machine CRUD management and booking oversight
- **Conflict detection** -- Firestore transactions reserve per-minute `booking_slots` for active requests
- **Responsive design** -- Mobile-optimized layouts, touch-friendly controls, and responsive grids
- **Security hardened** -- Input sanitization, Firestore rules, hashed lockout state, secure logging, Vercel security headers

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 with Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Backend / Auth | Firebase Authentication + Cloud Firestore |
| Routing | React Router v7 |
| Animations | Framer Motion |
| Date Handling | date-fns |
| Notifications | Sonner |
| Deployment | Vercel |

---

## Project Structure

```text
src/
  components/
    admin/          -- MachineManager (CRUD)
    bookings/       -- BookingForm, BookingModal
    dashboard/      -- StudentDashboard, FacultyDashboard
    layouts/        -- DashboardLayout (sidebar + mobile nav)
    machines/       -- MachineCard, MachineDetailsModal
    profile/        -- ProfileModal
    ui/             -- shadcn/ui primitives
  hooks/
    useAuth.js      -- Firebase Auth context provider + hook
  lib/
    constants.js    -- App-wide constants
    firebase.js     -- Firebase client initialization
    security.js     -- Input validation, rate limiting, secure logging
    utils.js        -- cn() utility
  pages/
  services/
    authService.js
    bookingService.js
    machineService.js
firebase/
  firestore.rules
  firestore.indexes.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication and Cloud Firestore enabled
- Firebase CLI if you want to deploy rules/indexes from this repo

### Installation

```bash
git clone https://github.com/<your-org>/lab-dashboard.git
cd lab-dashboard
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Firebase Setup

1. Enable the Email/Password provider in Firebase Authentication.
2. Create a Firestore database in production mode.
3. Deploy the included rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

4. Create your first admin by setting `profiles/{uid}.role` to `admin` in the Firebase console or with an Admin SDK script.

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

## Data Model

- **profiles** -- Firebase Auth UID keyed profile documents with role, department, and contact info
- **machines** -- Lab equipment with name, location, specs object, and active flag
- **bookings** -- Links students to machines with date, time, purpose, and status
- **booking_slots** -- Per-minute active booking locks used by Firestore transactions to block overlaps
- **login_attempts** -- Hashed-email lockout tracking for failed sign-in attempts
- **booking_rules** -- Reserved for future per-machine constraints
- **audit_log** -- Reserved for future server-side audit events

Key controls:

- Students can view and cancel their own bookings
- Faculty and admins can view and update all bookings
- Students see active machines; faculty/admin users can manage the full machine catalog
- New signups create `profiles/{uid}` documents during Firebase Auth signup
- Booking creation checks and reserves every minute in the requested interval inside a Firestore transaction

See [firebase/README.md](firebase/README.md) for migration notes and deployment details.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run vercel-build` | Lint and build for Vercel deployment |

---

## License

MIT
