const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const {
  getGmailClient,
  fetchUnreadEmails,
  parseEmail,
  markEmailAsRead
} = require("./emailParser");

admin.initializeApp();
const db = admin.firestore();

// Define secrets
const BRIEFING_API_KEY = defineSecret("BRIEFING_API_KEY");
const GMAIL_CLIENT_ID = defineSecret("GMAIL_CLIENT_ID");
const GMAIL_CLIENT_SECRET = defineSecret("GMAIL_CLIENT_SECRET");
const GMAIL_REFRESH_TOKEN = defineSecret("GMAIL_REFRESH_TOKEN");

/**
 * Normalize course codes to handle variations like:
 * - "Math 226" vs "MATH-226" vs "MATH226"
 * - "CS104" vs "CSCI-104" vs "CS 104"
 */
function normalizeCourse(course) {
  if (!course) return 'OTHER';

  let normalized = course.toUpperCase().trim();

  // Replace spaces/hyphens with single hyphen
  normalized = normalized.replace(/[\s-]+/g, '-');

  // Handle "MATH226" -> "MATH-226"
  normalized = normalized.replace(/([A-Z]+)(\d)/, '$1-$2');

  // Expand common course code abbreviations
  // "CS-104" -> "CSCI-104" (Ed emails use "CS104" but course is "CSCI-104")
  normalized = normalized.replace(/^CS-(\d)/, 'CSCI-$1');

  return normalized.replace(/-+$/, '');
}

/**
 * Normalize assignment/task titles for deduplication
 * Handles variations like:
 * - "HW1", "HW 1", "Homework 01", "HW Assignment 1" → "hw1"
 * - "[Lab] lab01 install dart" → "lab01"
 * - "Complete CS104 HW1 via GitHub" → "hw1"
 */
function normalizeTitle(title) {
  if (!title) return '';

  let normalized = title.trim();

  // Remove [Lab], [Lecture], [Discussion] prefixes
  normalized = normalized.replace(/^\[(lab|lecture|discussion)\]\s*/i, '');

  // Remove common verb prefixes (case-insensitive)
  normalized = normalized.replace(/^(submit|complete|finish|do|start|work on|turn in|upload|hand in|deliver|send|post|read|review|prepare|watch|attend)\s+/i, '');

  // Remove course prefix if present (e.g., "CS104 HW1" -> "HW1")
  normalized = normalized.replace(/^[A-Z]{2,4}[-\s]?\d{2,4}[A-Z]?\s+/i, '');

  // Remove trailing details after core assignment name
  // "HW1 (coding + written)" → "HW1"
  // "HW1 via GitHub Classroom" → "HW1"
  normalized = normalized.replace(/\s*\(.*\)\s*$/, '');
  normalized = normalized.replace(/\s+via\s+.*$/i, '');

  // Normalize homework variations to "hwN" format
  // "Homework 01" → "hw1", "HW Assignment 1" → "hw1", "HW 1" → "hw1"
  normalized = normalized.replace(/^(homework|hw)\s*(assignment)?\s*0*(\d+)/i, 'hw$3');

  // Normalize lab variations to "labN" format
  // "lab01 install dart" → "lab1", "Lab 1" → "lab1"
  normalized = normalized.replace(/^lab\s*0*(\d+).*$/i, 'lab$1');

  // Normalize problem set variations
  // "Problem Set 3" → "ps3", "PS 3" → "ps3"
  normalized = normalized.replace(/^(problem\s*set|ps)\s*0*(\d+)/i, 'ps$2');

  // Normalize quiz variations
  // "Quiz 1" → "quiz1"
  normalized = normalized.replace(/^quiz\s*0*(\d+)/i, 'quiz$1');

  // Normalize whitespace and lowercase
  normalized = normalized.replace(/\s+/g, ' ').trim().toLowerCase();

  return normalized;
}

/**
 * Pick the better due date when merging duplicates
 * Prefers the later date (actual deadline vs early reminder)
 */
function pickBetterDueDate(date1, date2) {
  if (!date1) return date2;
  if (!date2) return date1;

  // Compare dates, return the later one
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return d1 > d2 ? date1 : date2;
}

/**
 * Generate a normalized key for an item (used for deduplication and tracking)
 */
function getItemKey(item, keyField) {
  const normalizedTitle = normalizeTitle(item[keyField] || '');
  const normalizedCourse = normalizeCourse(item.course);
  return `${normalizedTitle}-${normalizedCourse}`;
}

/**
 * Merge and deduplicate two arrays based on a key field
 * Uses smart normalization to catch duplicates like "Submit HW1" vs "Complete HW1"
 * When merging duplicates, prefers the later due date
 * @param {Array} existing - Existing array from Firestore
 * @param {Array} incoming - New array from the request
 * @param {string} keyField - Field to use for deduplication (e.g., 'task', 'title')
 * @returns {Object} { merged: Array, newItems: Array } - Merged array and list of new items
 */
function mergeAndDedupe(existing = [], incoming = [], keyField) {
  const seen = new Map();
  const existingKeys = new Set();
  const newItems = [];

  // Helper to merge two items, picking better values
  const mergeItems = (existingItem, newItem) => {
    const merged = { ...existingItem, ...newItem };

    // For due dates, pick the later one (more likely to be the actual deadline)
    if (existingItem.dueDate || newItem.dueDate) {
      merged.dueDate = pickBetterDueDate(existingItem.dueDate, newItem.dueDate);
    }

    // Normalize the course in the output
    if (merged.course) {
      merged.course = normalizeCourse(merged.course);
    }

    return merged;
  };

  // Add existing items first and track their keys
  existing.forEach(item => {
    const key = getItemKey(item, keyField);
    existingKeys.add(key);
    seen.set(key, item);
  });

  // Override/add incoming items (incoming takes precedence)
  incoming.forEach(item => {
    const key = getItemKey(item, keyField);
    const existingItem = seen.get(key) || {};
    const merged = mergeItems(existingItem, item);
    seen.set(key, merged);

    // Track if this is a new item (wasn't in existing)
    if (!existingKeys.has(key)) {
      newItems.push({
        key,
        title: item[keyField],
        course: normalizeCourse(item.course)
      });
    }
  });

  return {
    merged: Array.from(seen.values()),
    newItems
  };
}

/**
 * HTTP endpoint for Claude for Chrome to submit daily briefings
 *
 * Expected JSON structure:
 * {
 *   "date": "2025-01-15",
 *   "actionItems": [
 *     { "task": "Submit HW3", "priority": 1, "course": "CS101", "dueDate": "2025-01-16" }
 *   ],
 *   "assignments": [
 *     { "title": "HW3", "course": "CS101", "dueDate": "2025-01-16", "status": "pending", "url": "..." }
 *   ],
 *   "announcements": [
 *     { "course": "CS101", "title": "Class cancelled", "content": "...", "date": "2025-01-15" }
 *   ],
 *   "edPosts": [
 *     { "course": "CS101", "title": "Question about HW3", "isStaff": false, "isPinned": false, "url": "..." }
 *   ],
 *   "gradescope": [
 *     { "assignment": "HW2", "course": "CS101", "status": "submitted", "score": "95/100" }
 *   ]
 * }
 */
exports.submitBriefing = onRequest(
  {
    cors: true,
    secrets: [BRIEFING_API_KEY]
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Validate API key
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    const expectedKey = BRIEFING_API_KEY.value();
    if (!apiKey || apiKey !== expectedKey) {
      res.status(401).json({ error: "Unauthorized: Invalid API key" });
      return;
    }

    try {
      const briefing = req.body;

      // Validate required fields
      if (!briefing.date) {
        res.status(400).json({ error: "Missing required field: date" });
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(briefing.date)) {
        res.status(400).json({ error: "Invalid date format. Expected YYYY-MM-DD" });
        return;
      }

      // Fetch existing document to merge with (if any)
      const existingDoc = await db.collection("briefings").doc(briefing.date).get();
      const existing = existingDoc.exists ? existingDoc.data() : {};

      // Filter out invalid gradescope entries (empty, N/A, null assignment names)
      const filterValidGradescope = (items = []) => items.filter(item => {
        const name = (item.assignment || '').trim().toLowerCase();
        return name && name !== 'n/a' && name !== 'null' && name !== 'undefined';
      });

      // Merge arrays and track new items
      const actionItemsResult = mergeAndDedupe(existing.actionItems, briefing.actionItems, 'task');
      const assignmentsResult = mergeAndDedupe(existing.assignments, briefing.assignments, 'title');
      const announcementsResult = mergeAndDedupe(existing.announcements, briefing.announcements, 'title');
      const edPostsResult = mergeAndDedupe(existing.edPosts, briefing.edPosts, 'title');
      const gradescopeResult = mergeAndDedupe(existing.gradescope, briefing.gradescope, 'assignment');

      // Collect all new items from this submission
      const newItems = {
        actionItems: actionItemsResult.newItems,
        assignments: assignmentsResult.newItems,
        announcements: announcementsResult.newItems,
        edPosts: edPostsResult.newItems,
        gradescope: gradescopeResult.newItems.filter(item => {
          const name = (item.title || '').trim().toLowerCase();
          return name && name !== 'n/a' && name !== 'null' && name !== 'undefined';
        })
      };

      // Create a set of new item keys for the frontend to identify them
      const newItemKeys = [
        ...newItems.assignments.map(i => i.key),
        ...newItems.actionItems.map(i => i.key),
        ...newItems.announcements.map(i => i.key),
        ...newItems.edPosts.map(i => i.key),
        ...newItems.gradescope.map(i => i.key)
      ];

      // Prepare the document with merged arrays (deduped)
      const document = {
        date: briefing.date,
        summary: briefing.summary || existing.summary || null,
        actionItems: actionItemsResult.merged,
        assignments: assignmentsResult.merged,
        announcements: announcementsResult.merged,
        edPosts: edPostsResult.merged,
        gradescope: filterValidGradescope(gradescopeResult.merged),
        // Store the keys of items that were new in the most recent submission
        newItemKeys: newItemKeys,
        lastSubmissionAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Write merged document to Firestore
      await db.collection("briefings").doc(briefing.date).set(document);

      // Count total new items
      const totalNewItems = Object.values(newItems).reduce((sum, arr) => sum + arr.length, 0);
      const isUpdate = existingDoc.exists;

      res.status(200).json({
        success: true,
        message: `Briefing for ${briefing.date} ${isUpdate ? 'updated' : 'created'} successfully`,
        documentId: briefing.date,
        isUpdate,
        newItems: totalNewItems > 0 ? newItems : null,
        newItemsCount: totalNewItems
      });

    } catch (error) {
      console.error("Error saving briefing:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * HTTP endpoint to mark items as seen (clears newItemKeys)
 * Called by frontend after user views the dashboard
 */
exports.markAsSeen = onRequest(
  {
    cors: true
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { date } = req.body;

      if (!date) {
        res.status(400).json({ error: "Missing required field: date" });
        return;
      }

      // Clear newItemKeys for this date
      const docRef = db.collection("briefings").doc(date);
      const doc = await docRef.get();

      if (!doc.exists) {
        res.status(404).json({ error: "Briefing not found" });
        return;
      }

      await docRef.update({
        newItemKeys: [],
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp()
      });

      res.status(200).json({
        success: true,
        message: `Marked items as seen for ${date}`
      });

    } catch (error) {
      console.error("Error marking as seen:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * Scheduled function to check Gmail for school-related emails
 * Runs every hour and parses emails from Canvas, Gradescope, and Ed Discussion
 *
 * Required secrets:
 * - GMAIL_CLIENT_ID: OAuth client ID from Google Cloud Console
 * - GMAIL_CLIENT_SECRET: OAuth client secret
 * - GMAIL_REFRESH_TOKEN: OAuth refresh token (generated once via scripts/get-gmail-token.js)
 */
exports.checkEmails = onSchedule(
  {
    schedule: "every 1 hours",
    secrets: [GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN],
    timeZone: "America/Los_Angeles",
    retryCount: 1
  },
  async (context) => {
    console.log("Starting email check...");

    // Check if Gmail secrets are configured
    const clientId = GMAIL_CLIENT_ID.value();
    const clientSecret = GMAIL_CLIENT_SECRET.value();
    const refreshToken = GMAIL_REFRESH_TOKEN.value();

    if (!clientId || !clientSecret || !refreshToken) {
      console.log("Gmail credentials not configured. Skipping email check.");
      return;
    }

    try {
      // Get Gmail client
      const gmail = await getGmailClient(clientId, clientSecret, refreshToken);

      // Get last check timestamp from Firestore (default to 15 minutes ago)
      const metaDoc = await db.collection("meta").doc("emailSync").get();
      const fifteenMinutesAgo = Math.floor(Date.now() / 1000) - 900;
      const lastCheck = metaDoc.exists ? metaDoc.data().lastCheck : fifteenMinutesAgo;

      console.log(`Checking emails since ${new Date(lastCheck * 1000).toISOString()}`);

      // Fetch unread emails
      const emails = await fetchUnreadEmails(gmail, lastCheck);
      console.log(`Found ${emails.length} unread school emails`);

      if (emails.length === 0) {
        // Update last check timestamp even if no emails
        await db.collection("meta").doc("emailSync").set({
          lastCheck: Math.floor(Date.now() / 1000),
          lastRun: admin.firestore.FieldValue.serverTimestamp()
        });
        return;
      }

      // Parse each email and update briefings
      const today = new Date().toISOString().split("T")[0];
      const parsedItems = {
        actionItems: [],
        assignments: [],
        announcements: [],
        edPosts: [],
        gradescope: []
      };

      for (const email of emails) {
        try {
          const parsed = await parseEmail(gmail, email.id);

          if (parsed) {
            console.log(`Parsed email: ${parsed.type} from ${parsed.source}`);

            // Route to appropriate category (add source: 'gmail' to all items)
            switch (parsed.type) {
              case "assignment":
                parsedItems.assignments.push({
                  title: parsed.title,
                  course: parsed.course,
                  dueDate: parsed.dueDate,
                  status: "pending",
                  url: parsed.url,
                  source: "gmail"
                });
                // Also add as action item
                parsedItems.actionItems.push({
                  task: `Complete ${parsed.title}`,
                  priority: 2,
                  course: parsed.course,
                  dueDate: parsed.dueDate,
                  source: "gmail"
                });
                break;

              case "announcement":
                parsedItems.announcements.push({
                  course: parsed.course,
                  title: parsed.title,
                  content: parsed.content || "",
                  date: today,
                  source: "gmail"
                });
                break;

              case "edPost":
                parsedItems.edPosts.push({
                  course: parsed.course,
                  title: parsed.title,
                  isStaff: parsed.isStaff || false,
                  isPinned: parsed.isPinned || false,
                  url: parsed.url,
                  source: "gmail"
                });
                break;

              case "gradescope":
                parsedItems.gradescope.push({
                  assignment: parsed.assignment,
                  course: parsed.course,
                  status: parsed.status,
                  score: parsed.score,
                  source: "gmail"
                });
                break;
            }

            // Mark email as read after processing
            await markEmailAsRead(gmail, email.id);
          }
        } catch (parseError) {
          console.error(`Error parsing email ${email.id}:`, parseError.message);
          // Continue with other emails
        }
      }

      // Update today's briefing with parsed items
      const hasItems = Object.values(parsedItems).some(arr => arr.length > 0);

      if (hasItems) {
        // Fetch existing briefing for today
        const existingDoc = await db.collection("briefings").doc(today).get();
        const existing = existingDoc.exists ? existingDoc.data() : {};

        // Merge arrays and track new items (same as submitBriefing)
        const actionItemsResult = mergeAndDedupe(existing.actionItems, parsedItems.actionItems, "task");
        const assignmentsResult = mergeAndDedupe(existing.assignments, parsedItems.assignments, "title");
        const announcementsResult = mergeAndDedupe(existing.announcements, parsedItems.announcements, "title");
        const edPostsResult = mergeAndDedupe(existing.edPosts, parsedItems.edPosts, "title");
        const gradescopeResult = mergeAndDedupe(existing.gradescope, parsedItems.gradescope, "assignment");

        // Collect new item keys from Gmail
        const gmailNewItemKeys = [
          ...assignmentsResult.newItems.map(i => i.key),
          ...actionItemsResult.newItems.map(i => i.key),
          ...announcementsResult.newItems.map(i => i.key),
          ...edPostsResult.newItems.map(i => i.key),
          ...gradescopeResult.newItems.map(i => i.key)
        ];

        // Combine with existing newItemKeys (keep both manual and gmail new items)
        const existingNewItemKeys = existing.newItemKeys || [];
        const combinedNewItemKeys = [...new Set([...existingNewItemKeys, ...gmailNewItemKeys])];

        // Merge with existing data
        const document = {
          date: today,
          summary: existing.summary || null,
          actionItems: actionItemsResult.merged,
          assignments: assignmentsResult.merged,
          announcements: announcementsResult.merged,
          edPosts: edPostsResult.merged,
          gradescope: gradescopeResult.merged,
          newItemKeys: combinedNewItemKeys,
          lastEmailSyncAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("briefings").doc(today).set(document);
        console.log(`Updated briefing for ${today} with ${emails.length} email items (${gmailNewItemKeys.length} new)`);
      }

      // Update last check timestamp
      await db.collection("meta").doc("emailSync").set({
        lastCheck: Math.floor(Date.now() / 1000),
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
        emailsProcessed: emails.length
      });

      console.log("Email check complete");

    } catch (error) {
      console.error("Error in checkEmails:", error);
      throw error; // Rethrow to trigger retry
    }
  }
);
