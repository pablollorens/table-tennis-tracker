# Table Tennis Tracker

A Progressive Web App (PWA) for tracking table tennis matches in an office environment. Built with Next.js, Firebase, and designed for quick match recording and real-time rankings using an ELO rating system.

## Features

### Match Management
- **Quick Match Recording** - Simple interface to record match results on the go
- **Round-Robin Generation** - Automatically creates matches for all players in a session
- **Real-time Score Tracking** - Update scores as matches progress
- **Match History** - View all past matches with scores and ELO changes
- **Date Filtering** - Browse match history by specific dates

### Player & Rankings
- **Player Profiles** - Create and manage player information
- **ELO Rating System** - Dynamic rankings based on match performance (starting at 1200, K-factor: 32)
- **Live Leaderboard** - Real-time rankings sorted by current ELO rating
- **Win Probability** - Shows expected win probability and points before each match
- **Detailed Statistics** - Track wins, losses, win rate, streaks, and ELO progression
- **Points History Chart** - Visualize ELO rating changes over time

### Daily Sessions
- **Player Selection** - Choose which players are participating each day
- **Today's Matches** - View all matches scheduled for the current session
- **Pending/Completed Status** - Track which matches are finished

### Progressive Web App
- **Installable** - Add to home screen on any device
- **Offline Support** - Continue viewing data without internet connection
- **Push Notifications** - Daily reminders to record matches
- **Mobile-First Design** - Optimized for quick access on phones and tablets

### User Experience
- **Password Protection** - Shared office password for access control
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Performance Monitoring** - Integrated with Vercel Speed Insights
- **Clean UI** - Built with Shadcn/ui components for accessibility

## Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- React 18 with TypeScript
- Tailwind CSS
- Shadcn/ui components
- Chart.js for data visualization

**Backend & Database:**
- Firebase Firestore (real-time database)
- Firebase Authentication
- Firebase Cloud Functions (serverless)
- Firebase Cloud Messaging (push notifications)

**Performance:**
- PWA with service worker caching
- Offline data persistence
- Vercel Speed Insights

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project set up
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd table-tennis-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

4. Set up the shared password:
```bash
node scripts/setup-shared-password.js
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Deployment

The app is optimized for deployment on Vercel with Firebase as the backend:

1. Deploy to Vercel:
```bash
vercel
```

2. Deploy Firebase functions:
```bash
firebase deploy --only functions
```

## How It Works

### ELO Rating System
- All players start with a rating of 1200
- After each match, ratings are adjusted based on the outcome and the rating difference
- Expected win probability is calculated using: `1 / (1 + 10^((Rb - Ra) / 400))`
- Rating changes use a K-factor of 32 for moderate volatility

### Daily Workflow
1. **Select Players** - Choose who's playing today
2. **Generate Matches** - System creates round-robin matches
3. **Record Results** - Update match scores as games finish
4. **View Rankings** - Check the live leaderboard
5. **Track Progress** - View individual player stats and history

## Project Structure

```
table-tennis-tracker/
├── app/                  # Next.js app directory
│   ├── dashboard/       # Main app pages
│   └── profile/         # User profile
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── auth/           # Authentication
│   ├── matches/        # Match management
│   ├── players/        # Player management
│   └── ranking/        # Leaderboard
├── lib/                # Utilities and business logic
│   ├── firebase/       # Firebase configuration
│   ├── elo/           # ELO calculations
│   └── utils/         # Helper functions
├── hooks/             # Custom React hooks
└── functions/         # Firebase Cloud Functions
```

## Database Structure

**Firestore Collections:**
- `config` - App configuration and shared password
- `players` - Player profiles and statistics
- `sessions` - Daily playing sessions
- `sessions/{date}/matches` - Individual match records
- `matchHistory` - Global match history for quick queries

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
