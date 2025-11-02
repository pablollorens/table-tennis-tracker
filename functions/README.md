# Firebase Cloud Functions

This directory contains Firebase Cloud Functions for the Table Tennis Tracker application.

## Functions

### cleanupInactiveUsers

**Purpose:** Automatically deletes inactive players that are older than 3 days.

**Schedule:** Triggered by GitHub Actions daily at 3:00 AM UTC (NO Cloud Scheduler = $0 monthly cost!)

**What it deletes:**
- Player Firestore documents where `isActive == false` and `createdAt < 3 days ago`
- Associated avatar files from Firebase Storage (`avatars/{playerId}/*`)

**What it preserves:**
- Match history (matches contain denormalized player data, so they remain intact)

**Configuration:**
- **Trigger:** HTTP request (called by GitHub Actions)
- **Region:** us-central1
- **Runtime:** Node.js 20
- **Memory:** 512 MiB
- **Timeout:** 300 seconds (5 minutes)
- **Authentication:** Secret token (CLEANUP_SECRET)
- **Response:** 202 Accepted (job starts immediately, runs in background)

## Setup Instructions

### 1. Add Secret to GitHub

The function requires a secret token for authentication. Add it to your GitHub repository:

1. Go to your GitHub repository: https://github.com/[YOUR_USERNAME]/table-tennis-tracker
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CLEANUP_SECRET`
5. Value: `e7e0d968b07d4de5f5a20b280f18374bba6183f2d7b9eaa5926c6c252802154c`
6. Click **Add secret**

### 2. Verify GitHub Actions Workflow

The workflow file `.github/workflows/cleanup-inactive-users.yml` is already configured to:
- Run daily at 3:00 AM UTC
- Call the Firebase Cloud Function with authentication
- Can be manually triggered from GitHub Actions UI

### 3. Test the Function

**Manual test via GitHub:**
1. Go to **Actions** tab in your GitHub repository
2. Select **Cleanup Inactive Users** workflow
3. Click **Run workflow** → **Run workflow**
4. Check the workflow run to see results

**Manual test via curl:**
```bash
curl -X POST \
  -H "Authorization: Bearer e7e0d968b07d4de5f5a20b280f18374bba6183f2d7b9eaa5926c6c252802154c" \
  https://us-central1-table-tennis-tracker-edd77.cloudfunctions.net/cleanupInactiveUsers

# Expected response:
# HTTP 202 Accepted
# {"success":true,"message":"Cleanup job started","timestamp":"..."}
```

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
# Use Firebase CLI
npx firebase-tools functions:log --only cleanupInactiveUsers

# Or view in Firebase Console
# https://console.firebase.google.com/project/table-tennis-tracker-edd77/functions
```

### Local Testing

```bash
# Start the functions emulator
npm run serve
```

## Monitoring

You can monitor the function execution in:
- **GitHub Actions:** Check workflow runs for success/failure
- **Firebase Console:** Functions → Logs
- **Google Cloud Console:** Cloud Functions → cleanupInactiveUsers

The function logs:
- HTTP request received and job started (202 response)
- Start time and cutoff date
- Number of inactive players found
- Each player deletion (ID and nickname)
- Total deletion count on completion
- Any errors that occur

**Note:** The function returns HTTP 202 immediately to avoid timeout issues, then continues processing in the background. Check the Cloud Function logs to see actual deletion results.

## Manual Execution Options

**Option 1: GitHub Actions (Recommended)**
1. Go to GitHub → Actions tab
2. Select "Cleanup Inactive Users"
3. Click "Run workflow"

**Option 2: HTTP Request**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SECRET_HERE" \
  https://us-central1-table-tennis-tracker-edd77.cloudfunctions.net/cleanupInactiveUsers
```

**Option 3: Local Script**
```bash
node scripts/cleanup-players.js inactive
```

## Cost Analysis

**FREE! No recurring costs:**
- ✅ Cloud Functions: ~30 invocations/month (well within 2M free tier)
- ✅ GitHub Actions: Included free for public repos
- ✅ NO Cloud Scheduler: Saves $0.10/month by using GitHub Actions instead

**Estimated monthly cost: $0.00** 🎉

## Security

- Function requires `CLEANUP_SECRET` token to execute
- Token stored in GitHub Secrets (encrypted)
- Token stored in Google Secret Manager for Cloud Function
- Function has public invoker permission but validates secret before execution

## Notes

- The function uses Firebase Admin SDK with elevated privileges, bypassing Firestore security rules
- The composite index for `players` collection (isActive, createdAt) already exists in `firestore.indexes.json`
- No Firebase Authentication users are deleted (the app uses custom authentication)
- Function URL: https://us-central1-table-tennis-tracker-edd77.cloudfunctions.net/cleanupInactiveUsers
- The function returns HTTP 202 immediately and processes deletions in the background to prevent timeout issues
- The GitHub Actions workflow includes retry logic for resilience against cold start timeouts
