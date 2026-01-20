/**
 * Email Parser for Academic Dashboard
 * Connects to Gmail API and parses emails from Canvas, Gradescope, and Ed Discussion
 */

const { OAuth2Client } = require('google-auth-library');

// Email sender patterns to match
const EMAIL_PATTERNS = {
  brightspace: {
    from: /brightspace|d2l\.com/i,
    subjectPatterns: {
      assignment: /assignment|due|submission|quiz|exam/i,
      announcement: /announcement/i,
      grade: /grade|feedback/i
    }
  },
  gradescope: {
    from: /gradescope\.com/i,
    subjectPatterns: {
      grade: /graded|score|grade/i,
      submission: /submitted|submission/i,
      regrade: /regrade/i
    }
  },
  ed: {
    from: /edstem\.org/i,
    subjectPatterns: {
      post: /./i  // Match all Ed emails as posts
    }
  },
  // Supplemental Instruction for MATH-226
  si: {
    from: /suryadi@usc\.edu/i,
    course: 'MATH-226',
    label: 'SI'
  }
};

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

/**
 * Create an authenticated Gmail client using refresh token
 * @param {string} clientId - OAuth client ID
 * @param {string} clientSecret - OAuth client secret
 * @param {string} refreshToken - OAuth refresh token
 * @returns {object} Gmail API client wrapper with access token
 */
async function getGmailClient(clientId, clientSecret, refreshToken) {
  const oauth2Client = new OAuth2Client(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Get fresh access token
  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token,
    async fetch(endpoint, options = {}) {
      const url = `${GMAIL_API_BASE}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gmail API error: ${response.status} ${error}`);
      }
      return response.json();
    }
  };
}

/**
 * Fetch emails from specified sources since a given timestamp
 * @param {object} gmail - Gmail API client wrapper
 * @param {number} since - Unix timestamp (seconds) to search from
 * @returns {array} Array of message objects with id and threadId
 */
async function fetchSchoolEmails(gmail, since) {
  // Build query for school-related emails (Brightspace, Gradescope, Ed Discussion, SI)
  // Note: No is:unread filter - we track processed emails in Firestore instead
  const query = `after:${since} from:(brightspace OR gradescope.com OR edstem.org OR suryadi@usc.edu)`;

  try {
    const res = await gmail.fetch(`/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`);
    return res.messages || [];
  } catch (error) {
    console.error('Error fetching emails:', error.message);
    throw error;
  }
}

/**
 * Get full email content by message ID
 * @param {object} gmail - Gmail API client wrapper
 * @param {string} messageId - Gmail message ID
 * @returns {object} Full message data
 */
async function getEmailContent(gmail, messageId) {
  try {
    return await gmail.fetch(`/users/me/messages/${messageId}?format=full`);
  } catch (error) {
    console.error(`Error fetching email ${messageId}:`, error.message);
    throw error;
  }
}

/**
 * Extract headers from Gmail message
 * @param {object} message - Gmail message object
 * @returns {object} Extracted headers (from, subject, date)
 */
function extractHeaders(message) {
  const headers = message.payload?.headers || [];
  const result = {};

  for (const header of headers) {
    const name = header.name.toLowerCase();
    if (name === 'from') result.from = header.value;
    if (name === 'subject') result.subject = header.value;
    if (name === 'date') result.date = header.value;
  }

  return result;
}

/**
 * Extract plain text body from Gmail message
 * @param {object} message - Gmail message object
 * @returns {string} Plain text body content
 */
function extractBody(message) {
  const payload = message.payload;

  // Check for simple text body
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf8');
  }

  // Check for multipart message
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf8');
      }
      // Check nested parts
      if (part.parts) {
        for (const nestedPart of part.parts) {
          if (nestedPart.mimeType === 'text/plain' && nestedPart.body?.data) {
            return Buffer.from(nestedPart.body.data, 'base64').toString('utf8');
          }
        }
      }
    }
    // Fall back to HTML if no plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = Buffer.from(part.body.data, 'base64').toString('utf8');
        // Strip HTML tags for basic text extraction
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }

  return '';
}

/**
 * Determine the source of an email (brightspace, gradescope, ed, si)
 * @param {string} from - From header value
 * @returns {string|null} Source identifier or null
 */
function identifySource(from) {
  if (EMAIL_PATTERNS.brightspace.from.test(from)) return 'brightspace';
  if (EMAIL_PATTERNS.gradescope.from.test(from)) return 'gradescope';
  if (EMAIL_PATTERNS.ed.from.test(from)) return 'ed';
  if (EMAIL_PATTERNS.si.from.test(from)) return 'si';
  return null;
}

/**
 * Parse Brightspace email content
 * Subject format: "20261_50386 PHYS-151: Fundamentals of Physics I - Announcements: Lab Meetings"
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} dateStr - Email date string
 * @returns {object|null} Parsed item or null
 */
function parseBrightspaceEmail(subject, body, dateStr) {
  const result = {
    source: 'brightspace',
    type: null,
    course: null,
    title: subject,
    content: null,
    dueDate: null,
    url: null,
    date: dateStr
  };

  // Parse Brightspace subject format: "20261_50386 PHYS-151: Course Name - Category: Title"
  // Example: "20261_50386 PHYS-151: Fundamentals of Physics I: Mechanics and Thermodynamics - Announcements: Lab Meetings"
  const brightspaceMatch = subject.match(/^\d+_\d+\s+([A-Z]+-\d+[A-Z]*):\s*[^-]+-\s*([^:]+):\s*(.+)$/i);

  if (brightspaceMatch) {
    result.course = brightspaceMatch[1].trim();  // e.g., "PHYS-151"
    const category = brightspaceMatch[2].trim().toLowerCase();  // e.g., "Announcements"
    result.title = brightspaceMatch[3].trim();  // e.g., "Lab Meetings"

    // Determine type based on category
    if (category.includes('announcement')) {
      result.type = 'announcement';
      result.content = body.substring(0, 500);
    } else if (category.includes('assignment') || category.includes('quiz') || category.includes('exam')) {
      result.type = 'assignment';
    } else if (category.includes('grade') || category.includes('feedback')) {
      result.type = 'gradescope';  // Treat as grade update
      result.assignment = result.title;
      result.status = 'graded';
    } else {
      // Default to announcement for other categories
      result.type = 'announcement';
      result.content = body.substring(0, 500);
    }
  } else {
    // Fallback: try simpler pattern matching
    if (EMAIL_PATTERNS.brightspace.subjectPatterns.announcement.test(subject)) {
      result.type = 'announcement';
      result.content = body.substring(0, 500);
    } else if (EMAIL_PATTERNS.brightspace.subjectPatterns.assignment.test(subject)) {
      result.type = 'assignment';
    } else if (EMAIL_PATTERNS.brightspace.subjectPatterns.grade.test(subject)) {
      result.type = 'gradescope';
      result.assignment = result.title;
      result.status = 'graded';
    }
  }

  // Try to extract due date from body
  const dueDateMatch = body.match(/due\s*(?:date)?[:\s]*(\w+\s+\d{1,2},?\s*\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (dueDateMatch) {
    try {
      const parsed = new Date(dueDateMatch[1]);
      if (!isNaN(parsed.getTime())) {
        result.dueDate = parsed.toISOString().split('T')[0];
      }
    } catch (e) {
      // Ignore date parsing errors
    }
  }

  // Try to extract URL from body
  const urlMatch = body.match(/https?:\/\/[^\s<>"]+(?:brightspace|d2l)[^\s<>"]*/i);
  if (urlMatch) {
    result.url = urlMatch[0];
  }

  return result.type ? result : null;
}

/**
 * Parse Gradescope email content
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} dateStr - Email date string
 * @returns {object|null} Parsed item or null
 */
function parseGradescopeEmail(subject, body, dateStr) {
  const result = {
    source: 'gradescope',
    type: 'gradescope',
    course: null,
    assignment: subject,
    status: 'pending',
    score: null,
    date: dateStr
  };

  // Try to extract course name
  const courseMatch = subject.match(/^\[([^\]]+)\]/) || body.match(/course[:\s]*([^,\n]+)/i);
  if (courseMatch) {
    result.course = courseMatch[1].trim();
    result.assignment = subject.replace(/^\[[^\]]+\]\s*/, '').trim();
  }

  // Determine status and extract score
  if (EMAIL_PATTERNS.gradescope.subjectPatterns.grade.test(subject) ||
      EMAIL_PATTERNS.gradescope.subjectPatterns.grade.test(body)) {
    result.status = 'graded';

    // Try to extract score
    const scoreMatch = body.match(/(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*(\d+(?:\.\d+)?)/i);
    if (scoreMatch) {
      result.score = `${scoreMatch[1]}/${scoreMatch[2]}`;
    }
  } else if (EMAIL_PATTERNS.gradescope.subjectPatterns.submission.test(subject)) {
    result.status = 'submitted';
  }

  return result;
}

/**
 * Parse Ed Discussion email content
 * Subject format: "CS104-Sp26: HW1 Coding Portion Available"
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} dateStr - Email date string
 * @returns {object|null} Parsed item or null
 */
function parseEdEmail(subject, body, dateStr) {
  const result = {
    source: 'ed',
    type: 'edPost',
    course: null,
    title: subject,
    isStaff: false,
    isPinned: false,
    url: null,
    date: dateStr
  };

  // Parse Ed subject format: "CS104-Sp26: HW1 Coding Portion Available"
  const edMatch = subject.match(/^([A-Z]+\d+[A-Z]*(?:-[A-Za-z0-9]+)?):\s*(.+)$/i);
  if (edMatch) {
    // Extract just the course code (e.g., "CS104" from "CS104-Sp26")
    const fullCourse = edMatch[1].trim();
    result.course = fullCourse.replace(/-[A-Za-z]+\d+$/, '').trim();  // Remove term suffix like "-Sp26"
    result.title = edMatch[2].trim();
  } else {
    // Fallback: try bracket format [Course]
    const bracketMatch = subject.match(/^\[([^\]]+)\]/);
    if (bracketMatch) {
      result.course = bracketMatch[1].trim();
      result.title = subject.replace(/^\[[^\]]+\]\s*/, '').trim();
    }
  }

  // Check for staff indicator
  if (/staff|instructor|ta\s|teaching assistant/i.test(body) ||
      /\(staff\)|\(instructor\)/i.test(subject)) {
    result.isStaff = true;
  }

  // Check for pinned indicator
  if (/pinned|important/i.test(subject)) {
    result.isPinned = true;
  }

  // Try to extract URL
  const urlMatch = body.match(/https?:\/\/[^\s<>"]*edstem\.org[^\s<>"]*/i);
  if (urlMatch) {
    result.url = urlMatch[0];
  }

  return result;
}

/**
 * Parse Supplemental Instruction (SI) email content
 * From: suryadi@usc.edu (MATH-226 SI)
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} dateStr - Email date string
 * @returns {object} Parsed announcement item
 */
function parseSIEmail(subject, body, dateStr) {
  const result = {
    source: 'si',
    type: 'announcement',
    course: EMAIL_PATTERNS.si.course,  // MATH-226
    title: `[SI] ${subject}`,
    content: body.substring(0, 500),
    date: dateStr,
    url: null
  };

  // Try to extract any URLs from body
  const urlMatch = body.match(/https?:\/\/[^\s<>"]+/i);
  if (urlMatch) {
    result.url = urlMatch[0];
  }

  // Check if there's a date/time mentioned for SI session
  const dateMatch = body.match(/(\w+day,?\s+\w+\s+\d{1,2}|\d{1,2}\/\d{1,2})/i);
  const timeMatch = body.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?(?:\s*-\s*\d{1,2}:\d{2}\s*(?:am|pm)?)?)/i);

  if (dateMatch || timeMatch) {
    const sessionInfo = [dateMatch?.[0], timeMatch?.[0]].filter(Boolean).join(' at ');
    if (sessionInfo) {
      result.content = `SI Session: ${sessionInfo}\n\n${result.content}`;
    }
  }

  return result;
}

/**
 * Parse an email and extract relevant information
 * @param {object} gmail - Gmail API client
 * @param {string} messageId - Gmail message ID
 * @returns {object|null} Parsed email data or null if not relevant
 */
async function parseEmail(gmail, messageId) {
  const message = await getEmailContent(gmail, messageId);
  const headers = extractHeaders(message);
  const body = extractBody(message);

  const source = identifySource(headers.from);
  if (!source) return null;

  switch (source) {
    case 'brightspace':
      return parseBrightspaceEmail(headers.subject, body, headers.date);
    case 'gradescope':
      return parseGradescopeEmail(headers.subject, body, headers.date);
    case 'ed':
      return parseEdEmail(headers.subject, body, headers.date);
    case 'si':
      return parseSIEmail(headers.subject, body, headers.date);
    default:
      return null;
  }
}

/**
 * Mark an email as read
 * @param {object} gmail - Gmail API client wrapper
 * @param {string} messageId - Gmail message ID
 */
async function markEmailAsRead(gmail, messageId) {
  try {
    await gmail.fetch(`/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        removeLabelIds: ['UNREAD']
      })
    });
  } catch (error) {
    console.error(`Error marking email ${messageId} as read:`, error.message);
  }
}

module.exports = {
  getGmailClient,
  fetchSchoolEmails,
  getEmailContent,
  parseEmail,
  markEmailAsRead,
  identifySource,
  parseBrightspaceEmail,
  parseGradescopeEmail,
  parseEdEmail,
  parseSIEmail
};
