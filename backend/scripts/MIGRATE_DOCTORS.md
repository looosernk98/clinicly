# Migrate legacy doctor documents

## 1. Backup (required before running)

Replace connection details with yours. This project uses `MONGODB_URI` plus database name `prescripto`, same as [`backend/src/database/connection.js`](backend/src/database/connection.js).

Example using `mongodump`:

```bash
mongodump --uri="${MONGODB_URI}/prescripto" --collection=doctors --out=./backup-doctors-$(date +%Y%m%d)
```

Or export the `doctors` collection from MongoDB Compass.

## 2. Dry run

From the `backend` directory:

```bash
npm run migrate-doctors -- --dry-run
```

Review the logged `$set` / `$unset` per document.

## 3. Apply migration

```bash
npm run migrate-doctors
```

## 4. Verify

- In Compass, open a migrated doctor document: legacy keys (`name`, `password`, `speciality`, `fees`, `slots_booked`, …) should be gone; new keys (`first_name`, `password_hash`, `specialization`, …) present.
- Test doctor login for a migrated account.
