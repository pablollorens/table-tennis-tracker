# Firebase Cloud Functions

This directory contains Firebase Cloud Functions for the Table Tennis Tracker application.

## Functions

### cleanupInactiveUsers

**Purpose:** Automatically deletes inactive players that are older than 3 days.

**Schedule:** Runs daily at 3:00 AM UTC

**What it deletes:**
- Player Firestore documents where `isActive == false` and `createdAt < 3 days ago`
- Associated avatar files from Firebase Storage (`avatars/{playerId}/*`)

**What it preserves:**
- Match history (matches contain denormalized player data, so they remain intact)

**Configuration:**
- **Trigger:** Cloud Scheduler (cron: `0 3 * * *`)
- **Region:** us-central1
- **Runtime:** Node.js 20
- **Memory:** 256 MB (default)

## Development

### Building

```bash
npm run build
```

### Deploying

```bash
# Deploy all functions
npm run deploy

# Or use firebase-tools directly
npx firebase-tools deploy --only functions
```

### Viewing Logs

```bash
npm run logs

# Or use firebase-tools directly
npx firebase-tools functions:log
```

### Local Testing

```bash
# Start the functions emulator
npm run serve
```

## Monitoring

You can monitor the function execution in:
- **Firebase Console:** Functions → Logs
- **Google Cloud Console:** Cloud Functions → cleanupInactiveUsers

The function logs:
- Start time and cutoff date
- Number of inactive players found
- Each player deletion (ID and nickname)
- Total deletion count on completion
- Any errors that occur

## Manual Execution

If you need to manually trigger the function before its scheduled time:

1. Go to Firebase Console → Functions
2. Select `cleanupInactiveUsers`
3. Click "Test function"

Or use the existing cleanup script:
```bash
node scripts/cleanup-players.js inactive
```

## Cost Optimization

- **Artifact Cleanup Policy:** Automatically deletes container images older than 1 day to reduce storage costs
- **Scheduled Execution:** Runs once per day to minimize invocation costs
- **Efficient Queries:** Uses composite index for fast query execution

## Notes

- The function uses Firebase Admin SDK with elevated privileges, bypassing Firestore security rules
- The composite index for `players` collection (isActive, createdAt) already exists in `firestore.indexes.json`
- No Firebase Authentication users are deleted (the app uses custom authentication)
