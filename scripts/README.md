# Migration and Setup Scripts

This directory contains utility scripts for setting up and managing the Table Tennis Tracker application.

## Scripts

### `setup-password.js`

Sets up the shared office password used for new user registration.

**Usage:**
```bash
node scripts/setup-password.js
```

**What it does:**
- Creates/updates the shared password in Firestore (`settings/password` document)
- Default password: `pingpong`
- Users need this password to begin the registration process

**When to run:**
- First time setting up the application
- When you want to change the shared office password

---

### `migrate-players.js`

Migrates existing player data to support the new self-registration system.

**Usage:**
```bash
node scripts/migrate-players.js
```

**What it does:**
- Scans all players in the database
- For players without `nickname`, `passwordHash`, or `isActive`:
  - Generates a nickname from their name (e.g., "John Doe" → "johndoe")
  - Sets a default password: `changeme123`
  - Marks them as active (`isActive: true`)
- Handles duplicate nicknames by appending numbers

**When to run:**
- After implementing the self-registration feature
- When migrating from the old player system to the new one
- Only needs to be run once per database

**After migration:**
1. Notify all migrated users of their auto-generated nickname
2. Share the default password: `changeme123`
3. Instruct users to change their password after first login

---

## Prerequisites

Both scripts require:

1. **Environment variables** - Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

2. **Dependencies** - Run from project root:
   ```bash
   npm install
   ```

## Safety

- Both scripts are safe to run multiple times
- `migrate-players.js` only updates players that need migration
- No data is deleted by these scripts
- All operations are logged to the console

## Troubleshooting

**Error: "Missing environment variables"**
- Ensure `.env.local` exists in the project root
- Verify all Firebase config variables are set

**Error: "Permission denied"**
- Check Firestore security rules
- Ensure the Firebase project has the correct permissions

**Migration creates duplicate nicknames**
- The script automatically handles duplicates by appending numbers
- Example: If "johndoe" exists, it creates "johndoe1", "johndoe2", etc.
