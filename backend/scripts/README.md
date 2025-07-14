# Bulk Add Doctors Script

This script adds the static doctor data from the frontend assets to the database.

## Prerequisites

1. Make sure your backend server is running
2. Ensure your MongoDB database is connected
3. Set up your environment variables in `.env` file:
   ```
   ADMIN_EMAIL=your_admin_email
   ADMIN_PASSWORD=your_admin_password
   BACKEND_URL=http://localhost:5000
   ```

## Installation

1. Install the new dependency:
   ```bash
   npm install
   ```

## Usage

Run the script to add all doctors to the database:

```bash
npm run add-doctors
```

Or directly:

```bash
node scripts/addDoctors.js
```

## What the script does

1. **Logs in as admin** using the credentials from your `.env` file
2. **Calls the bulk add API** to add all 14 doctors from the static data
3. **Handles duplicates** - if a doctor with the same email already exists, it will be skipped
4. **Provides feedback** - shows how many doctors were added and how many were skipped

## Doctor Data Added

The script adds 14 doctors with the following specialties:
- **General physician**: 3 doctors (fees: ₹500)
- **Gynecologist**: 3 doctors (fees: ₹600)
- **Dermatologist**: 2 doctors (fees: ₹300)
- **Pediatricians**: 2 doctors (fees: ₹400)
- **Neurologist**: 4 doctors (fees: ₹500)

Each doctor has:
- Unique email address following pattern: `firstname.lastname@clinicly.com`
- Original profile image from frontend assets (doc1.png to doc14.png)
- Exact same about section as in the frontend assets
- Correct fees matching the frontend data
- London address as specified in the assets

## Image Access

The doctor images are served from:
- **Local path**: `/public/images/doctors/doc1.png` to `/public/images/doctors/doc14.png`
- **Full URL**: `http://localhost:5000/public/images/doctors/doc1.png`

Images are copied from `frontend/src/assets/` to `backend/public/images/doctors/` and served statically by the Express server.

## API Endpoint

The script uses the new API endpoint: `POST /api/admin/bulk-add-doctors`

This endpoint:
- Requires admin authentication
- Checks for existing doctors by email
- Hashes passwords securely
- Returns success/failure status with counts

## Troubleshooting

If you encounter issues:

1. **Check your environment variables** - make sure ADMIN_EMAIL and ADMIN_PASSWORD are set correctly
2. **Verify server is running** - ensure your backend server is started
3. **Check database connection** - make sure MongoDB is connected
4. **Verify images exist** - ensure doctor images are copied to `backend/public/images/doctors/`
5. **Review logs** - the script provides detailed error messages

## Security Notes

- All doctors are created with the password `password123` (you should change this in production)
- Emails follow the pattern: `firstname.lastname@clinicly.com`
- Images are served locally from the backend public directory 