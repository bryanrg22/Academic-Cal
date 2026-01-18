# Academic Dashboard

A personal academic dashboard that aggregates course information from Brightspace, Gradescope, and Ed Discussion into a unified daily briefing view.

## Features

- **Daily Briefings** - View assignments, announcements, and action items for each day
- **Multi-source Aggregation** - Data from Brightspace, Gradescope, Ed Discussion, and manual input
- **Task Tracking** - Check off completed tasks (persisted to Firestore)
- **Email Polling** - Automatic updates from school email notifications (every 15 min)
- **Smart Deduplication** - Same assignment from multiple sources merged automatically
- **Calendar Views** - Weekly and monthly calendar with assignment deadlines
- **History** - Browse past briefings by date

## Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Claude for Chrome  │────▶│ Firebase Function│────▶│    Firestore    │
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

---

## Quick Start

### Development (Demo Mode)

The app works without Firebase configuration using sample data:

```bash
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

---

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
# Install googleapis if needed
npm install googleapis

# Run the token generator
node scripts/get-gmail-token.cjs
```

Follow the prompts to authorize the app in your browser.

### 5. Set Firebase Secrets

```bash
firebase functions:secrets:set GMAIL_CLIENT_ID
# Enter your client ID

firebase functions:secrets:set GMAIL_CLIENT_SECRET
# Enter your client secret

firebase functions:secrets:set GMAIL_REFRESH_TOKEN
# Enter the refresh token from step 4
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

---

## Claude for Chrome Prompt

Use this prompt with Claude for Chrome to parse your course pages and generate briefings:

```
You are my academic assistant. Analyze my course pages and create a daily briefing.

## My Courses
- CSCI-104 (normalize to CS-104)
- PHYS-151
- MATH-226
- TAC-368

## What to Gather

1. **Daily Summary** - 2-3 sentence overall summary and 1-2 sentence per-course summaries
2. **Assignments** - title, due date, submission status
3. **Announcements** - recent announcements from instructors
4. **Ed Discussion** - important posts (pinned or staff posts only)
5. **Gradescope** - ONLY entries with actual scores (skip empty/ungraded)
6. **Sources** - cite where each piece of information came from

## Critical Rules

### actionItems vs assignments (IMPORTANT)

These are DIFFERENT arrays with different purposes:

**actionItems** = ONLY urgent tasks that need attention NOW
- Include ONLY items that are: overdue, due today, or due tomorrow
- Do NOT include every assignment — only the urgent ones
- This drives the "Action Items" section on the dashboard

**assignments** = ALL assignments regardless of urgency
- Include every assignment you find
- This is the complete record of coursework

Example: If HW3 is due in 5 days, it goes in `assignments` but NOT in `actionItems`.

### Deduplication (CRITICAL)

The same assignment appears on multiple platforms with different names. You MUST normalize and deduplicate.

**Assignment Name Normalization:**

| Variations you might see | Output as |
|--------------------------|-----------|
| "HW1", "HW 1", "Homework 01", "HW Assignment 1", "Homework 1" | **"HW1"** |
| "lab01 install dart", "[Lab] lab01", "Lab 1" | **"Lab 1"** |
| "Quiz 1", "Quiz 01" | **"Quiz 1"** |
| "Problem Set 3", "PS3", "PS 3" | **"PS3"** |

**Strip these from the beginning:**
- Verb prefixes: Submit, Complete, Finish, Turn in, Work on, Upload, Hand in, Deliver, Send, Post, Read, Review, Prepare, Watch, Attend
- [Lab], [Lecture], [Discussion] tags
- Course codes: "CS104 HW1" → "HW1"

**Strip these from the end:**
- Parenthetical details: "HW1 (coding + written)" → "HW1"
- "via" clauses: "HW1 via GitHub Classroom" → "HW1"

**Examples:**
- "Complete CS104 HW1 via GitHub Classroom" → **"HW1"** with course **"CS-104"**
- "[Lab] lab01 install dart" → **"Lab 1"** with course **"TAC-368"**
- "Submit Homework 01" → **"HW1"**

### Course Code Normalization

Use format **DEPT-###** (uppercase, hyphen, numbers). These are my specific courses:

| Input variations | Output |
|------------------|--------|
| "CSCI-104", "CSCI 104", "CS104", "CS-104" | **CS-104** |
| "Math 226", "MATH226" | **MATH-226** |
| "PHYS-151", "Physics 151" | **PHYS-151** |
| "TAC-368", "TAC 368" | **TAC-368** |

Section numbers like "20261_50380" should be stripped — just use the course code.

### Due Date Conflicts

When same assignment has different due dates on different platforms:
- Use the **LATER** date (actual deadline, not early reminder)
- Example: Gradescope says Jan 17, Brightspace says Jan 23 → use **Jan 23**

### Gradescope Rules

Only include gradescope entries that have ACTUAL scores:
- ✅ Include: `"score": "95/100"`, `"score": "18/20"`
- ❌ Skip: entries with no score, "—", "N/A", or empty fields

### Section Merging

Lecture and lab sections are the same course:
- "20261_50380 PHYS-151" (lecture) → **PHYS-151**
- "20261_50386 PHYS-151" (lab) → **PHYS-151**
- Do NOT prefix with [Lecture] or [Lab] — just use the course code

## Output Format

Provide the briefing in chat with:
1. Overall summary (2-3 sentences)
2. Per-course summaries
3. Action items (URGENT ONLY) sorted by priority
4. Assignments table with sources
5. Current grades per course
6. Important Ed Discussion posts
7. JSON block for the dashboard (below)

## JSON Structure (for Dashboard API)

{
  "date": "YYYY-MM-DD",

  "summary": {
    "overall": "Brief 2-3 sentence overview. Mention key deadlines, urgent items, overall workload.",
    "courses": {
      "CS-104": "1-2 sentence summary for this course",
      "PHYS-151": "1-2 sentence summary for this course"
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

  "announcements": [
    {
      "course": "PHYS-151",
      "title": "Lab Meetings",
      "content": "Brief summary of announcement",
      "date": "YYYY-MM-DD"
    }
  ],

  "edPosts": [
    {
      "course": "CS-104",
      "title": "HW1 Coding Portion Available",
      "isStaff": true,
      "isPinned": false,
      "url": "https://edstem.org/..."
    }
  ],

  "gradescope": [
    {
      "assignment": "HW2",
      "course": "CS-104",
      "status": "graded",
      "score": "95/100"
    }
  ]
}

## Priority Levels
- 1 = High (overdue or due today/tomorrow) — these go in actionItems
- 2 = Medium (due within a week) — do NOT put in actionItems
- 3 = Low (due later or optional) — do NOT put in actionItems

## Status Values
- "pending" = not submitted
- "submitted" = submitted, awaiting grade
- "graded" = graded

## Date Format
Always use YYYY-MM-DD format for all dates.

Use today's date for the "date" field.
```

---

## API Reference

### Submit Briefing

```
POST https://submitbriefing-fxtu2qcmfq-uc.a.run.app
```

**Headers:**
```
Content-Type: application/json
X-API-Key: <your-api-key>
```

**Body:** See JSON structure in the prompt above.

**Response:**
```json
{
  "success": true,
  "message": "Briefing for 2026-01-17 saved successfully",
  "documentId": "2026-01-17"
}
```

### Data Merging

When you submit a briefing for a date that already has data:
- Arrays are **merged**, not replaced
- Duplicates are detected by `task` + `course` (action items), `title` + `course` (assignments), etc.
- New items are added, existing items are updated

---

## Project Structure

```
assistant_calendar/
├── src/
│   ├── components/       # React components
│   │   ├── Dashboard.jsx
│   │   ├── ActionItems.jsx
│   │   ├── AssignmentCard.jsx
│   │   ├── AnnouncementList.jsx
│   │   ├── EdPostList.jsx
│   │   └── ...
│   ├── pages/            # Dashboard and History pages
│   ├── hooks/
│   │   ├── useBriefing.jsx        # Firestore data fetching
│   │   └── useCompletedTasks.jsx  # Task persistence
│   └── lib/
│       └── firebase.js   # Firebase config
├── functions/
│   ├── index.js          # Cloud Functions (submitBriefing, checkEmails)
│   ├── emailParser.js    # Gmail parsing logic
│   └── package.json
├── scripts/
│   └── get-gmail-token.cjs  # OAuth setup helper
├── firestore.rules
└── firebase.json
```

---

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

---

## License

MIT
