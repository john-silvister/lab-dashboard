# Lab Dashboard - Firebase QA Checklist

Use this after deploying:
- `firebase/firestore.rules`
- `firebase/firestore.indexes.json`

## 1) Build and Quality Gates
1. Run: `npm run lint`
2. Run: `npm run build`
3. Run: `npm run vercel-build`
4. Run: `npm audit --omit=dev`

Expected:
- No lint errors
- Build succeeds
- Vercel build succeeds
- No high or critical runtime vulnerabilities

## 2) Firebase Auth and Lockout Validation
1. Sign up a student account with a valid student domain email.
2. Sign up a faculty account with a valid faculty domain email.
3. Confirm a `profiles/{uid}` document is created in Firestore.
4. Attempt login with the wrong password 5 times for one email.
5. Confirm lockout message appears with remaining seconds.
6. Close and reopen browser, retry same email.

Expected:
- Firebase Auth creates users successfully
- Profile documents contain the expected role and university fields
- Lockout persists through Firestore-backed `login_attempts/{emailHash}`
- Successful login clears lockout state

## 3) Role and Access Control
1. Student login:
- Can access Dashboard, Machines, Bookings
- Cannot access Admin page
2. Faculty login:
- Can access Admin page
- Can approve/reject bookings
3. Admin login:
- Can manage machines
- Can manually adjust user roles when needed

Expected:
- Firestore rules and UI route guards enforce role boundaries

## 4) Booking Flow and Conflict Safety
1. Create booking request as student.
2. Confirm `bookings/{bookingId}` and matching `booking_slots/*` documents are created.
3. Try creating an overlapping booking for the same machine/time.
4. Approve or reject booking from faculty/admin.
5. Cancel pending/approved booking as student.

Expected:
- Overlaps are blocked
- Faculty can approve/reject
- Student can only cancel own active bookings
- Rejected/cancelled bookings release their `booking_slots`

## 5) Popup, Dialog, and Toast UX
1. Open each modal:
- Profile modal
- Booking modal
- Machine details modal
- Faculty reject/details modals
- Admin machine create/edit modal
2. Test on small viewport/mobile width.
3. Trigger success and error toasts.

Expected:
- Dialogs are centered and visible
- Dialog content scrolls inside viewport
- Toasts appear top-right and are fully visible

## 6) Realtime and Stability
1. Keep student Bookings page open.
2. Approve/reject from faculty account.
3. Keep faculty dashboard open.
4. Submit a new booking from a student account.

Expected:
- Firestore realtime snapshots update both pages
- No UI crashes

## 7) Webhook Endpoint Safety
1. Send POST to `/api/internal/sync` with wrong secret.
2. Send malformed payload with correct secret.
3. Send valid profile INSERT payload with correct secret.

Expected:
- Wrong secret rejected
- Malformed payload rejected
- Valid payload accepted and appended to the audit sheet

## 8) Production Readiness Sign-off
1. Confirm Firebase env vars exist in hosting.
2. Confirm Firestore rules/indexes deployed.
3. Execute smoke run for student + faculty accounts.
4. Capture screenshots for all primary flows.
5. Record sign-off date and tester initials.
