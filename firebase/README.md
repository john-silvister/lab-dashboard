# Firebase Backend

This project now uses Firebase Authentication and Cloud Firestore.

## Collections

- `profiles/{uid}`: account profile document keyed by Firebase Auth UID.
- `machines/{machineId}`: lab machine catalog.
- `bookings/{bookingId}`: booking requests and approval state.
- `booking_slots/{machineId}_{date}_{HHmm}`: one document per booked minute, used by transactions to prevent overlapping active bookings.
- `booking_rules/{ruleId}` and `audit_log/{logId}`: reserved collections for future rule and audit workflows.

Login throttling is intentionally not stored in Firestore. The browser applies a local UX throttle, and Firebase Auth remains the authoritative abuse-control layer.

## Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Migration Notes

1. Create a Firebase project and enable Authentication with the Email/Password provider.
2. Create a Firestore database in production mode.
3. Deploy `firebase/firestore.rules` and `firebase/firestore.indexes.json`.
4. Import legacy machine/profile/booking records into the collections above. If you import old machine and booking UUIDs as Firestore document IDs, existing references remain stable.
5. Generate `booking_slots` documents for every active `pending` or `approved` booking before opening the app to users.
6. Promote admin users by manually setting `profiles/{uid}.role` to `admin` from the Firebase console or an Admin SDK script.
