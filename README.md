# Academic Dashboard

A personal academic dashboard that aggregates course information from Brightspace, Gradescope, and Ed Discussion into a unified daily briefing view.

## Features

- **Daily Briefings** - View assignments, announcements, and action items for each day
- **Multi-source Aggregation** - Data from Brightspace, Gradescope, Ed Discussion, and manual input
- **Task Tracking** - Check off completed tasks (persisted to Firestore)
- **Email Polling** - Automatic updates from school email notifications (every 15 min)
- **Smart Deduplication** - Same assignment from multiple sources merged automatically
- **Calendar Views** - Weekly calendar with assignment deadlines
- **History** - Browse past briefings by date
- **Quick Add Tasks** - Add personal tasks directly from the dashboard

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser Extension  │────▶│ Firebase Function│────▶│    Firestore    │
│  (Manual briefings) │     │  submitBriefing  │     │   /briefings    │
└─────────────────────┘     └──────────────────┘     └────────┬────────┘
                                                              │
┌─────────────────────┐     ┌──────────────────┐              │
│      Gmail          │────▶│ Firebase Function│──────────────┘
│ (Brightspace, Ed,   │     │   checkEmails    │
│  Gradescope emails) │     │  (every 15 min)  │
└─────────────────────┘     └──────────────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │  React Frontend │
                                                    │   (Vite + TW)   │
                                                    └─────────────────┘
```

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Firebase (Firestore + Cloud Functions v2)
- **Database**: Firestore
- **Email Integration**: Gmail API with OAuth 2.0
- **Routing**: React Router v7
- **Date Handling**: date-fns

## Quick Start

### Development (Demo Mode)

The app works without Firebase configuration using sample data:

```bash
cd assistant_calendar
npm install
npm run dev
```

Open http://localhost:5173 to see the dashboard with demo data.

### Production Setup

1. **Create a Firebase project** at https://console.firebase.google.com

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your Firebase credentials from Project Settings > General > Your apps.

3. **Set the API key secret** for the Cloud Function:
   ```bash
   firebase functions:secrets:set BRIEFING_API_KEY
   ```

4. **Deploy Firestore rules and functions**:
   ```bash
   firebase deploy --only firestore:rules
   cd functions && npm install && cd ..
   firebase deploy --only functions
   ```

5. **Deploy frontend**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Gmail Email Polling Setup

The dashboard can automatically poll your Gmail for school notifications and update your briefings.

### 1. Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Go to **APIs & Services > Library**
4. Search for "Gmail API" and **Enable** it

### 2. Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Choose **Desktop app** as the application type
4. Download the credentials JSON

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Add your email as a **test user**

### 4. Generate Refresh Token

```bash
node scripts/get-gmail-token.cjs
```

Follow the prompts to authorize the app in your browser.

### 5. Set Firebase Secrets

```bash
firebase functions:secrets:set GMAIL_CLIENT_ID
firebase functions:secrets:set GMAIL_CLIENT_SECRET
firebase functions:secrets:set GMAIL_REFRESH_TOKEN
```

### 6. Deploy

```bash
firebase deploy --only functions
```

The `checkEmails` function will now run every 15 minutes and parse emails from:

| Source | Email Pattern | Extracts |
|--------|--------------|----------|
| Brightspace | `*@mail.brightspace.*.edu` | Announcements, assignments, grades |
| Ed Discussion | `*@edstem.org` | Posts, staff replies, pinned content |
| Gradescope | `*@gradescope.com` | Submissions, grades, scores |

## API Reference

### Submit Briefing

```
POST https://<your-function-url>/submitBriefing
```

**Headers:**
```
Content-Type: application/json
X-API-Key: <your-api-key>
```

**Body:**
```json
{
  "date": "YYYY-MM-DD",
  "summary": {
    "overall": "Brief overview of the day",
    "courses": {
      "CS-104": "Course-specific summary"
    }
  },
  "actionItems": [
    {
      "task": "HW3",
      "priority": 1,
      "course": "CS-104",
      "dueDate": "YYYY-MM-DD"
    }
  ],
  "assignments": [
    {
      "title": "HW3",
      "course": "CS-104",
      "dueDate": "YYYY-MM-DD",
      "status": "pending",
      "url": "https://..."
    }
  ],
  "announcements": [...],
  "edPosts": [...],
  "gradescope": [...]
}
```

### Data Merging

When you submit a briefing for a date that already has data:
- Arrays are **merged**, not replaced
- Duplicates are detected by `task` + `course` (action items), `title` + `course` (assignments), etc.
- New items are added, existing items are updated

## Project Structure

```
assistant_calendar/
├── src/
│   ├── components/       # React components
│   ├── pages/            # Dashboard, History, Submit pages
│   ├── hooks/            # useBriefing, useCompletedTasks
│   └── lib/              # Firebase config, utilities
├── functions/
│   ├── index.js          # Cloud Functions (submitBriefing, checkEmails)
│   ├── emailParser.js    # Gmail parsing logic
│   └── package.json
├── scripts/
│   └── get-gmail-token.cjs
├── firestore.rules
└── firebase.json
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

MIT
