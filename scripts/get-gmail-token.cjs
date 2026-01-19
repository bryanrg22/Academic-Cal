/**
 * Gmail OAuth Token Generator
 *
 * This script helps you generate a refresh token for the Gmail API.
 * Run this ONCE to get your refresh token, then store it as a Firebase secret.
 *
 * Prerequisites:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com
 * 2. Create a project (or use your existing Firebase project)
 * 3. Enable the Gmail API:
 *    - Go to APIs & Services > Library
 *    - Search for "Gmail API" and enable it
 * 4. Create OAuth 2.0 credentials:
 *    - Go to APIs & Services > Credentials
 *    - Click "Create Credentials" > "OAuth client ID"
 *    - Choose "Desktop app" as the application type
 *    - Download the credentials JSON file
 * 5. Configure OAuth consent screen:
 *    - Go to APIs & Services > OAuth consent screen
 *    - Add your email as a test user
 *
 * Usage:
 *   1. Replace CLIENT_ID and CLIENT_SECRET below with your values
 *   2. Run: node scripts/get-gmail-token.js
 *   3. Open the URL in your browser and authorize the app
 *   4. Copy the code from the redirect URL
 *   5. Enter the code when prompted
 *   6. Save the refresh token as a Firebase secret:
 *      firebase functions:secrets:set GMAIL_REFRESH_TOKEN
 */

const { google } = require('googleapis');
const readline = require('readline');
const http = require('http');
const url = require('url');

// ============================================
// YOUR CREDENTIALS (from Google Cloud Console)
// Replace these with your own OAuth credentials
// ============================================
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
// ============================================

const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function main() {
  if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    SETUP REQUIRED                              ║
╠════════════════════════════════════════════════════════════════╣
║ Before running this script, you need to:                       ║
║                                                                ║
║ 1. Go to Google Cloud Console:                                 ║
║    https://console.cloud.google.com                            ║
║                                                                ║
║ 2. Enable the Gmail API for your project                       ║
║                                                                ║
║ 3. Create OAuth 2.0 credentials (Desktop app type)             ║
║                                                                ║
║ 4. Edit this file and replace:                                 ║
║    - CLIENT_ID with your OAuth client ID                       ║
║    - CLIENT_SECRET with your OAuth client secret               ║
║                                                                ║
║ 5. Add your email as a test user in OAuth consent screen       ║
╚════════════════════════════════════════════════════════════════╝
    `);
    process.exit(1);
  }

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh token
  });

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 Gmail OAuth Token Generator                    ║
╚════════════════════════════════════════════════════════════════╝

Step 1: Open this URL in your browser:

${authUrl}

Step 2: Sign in with your Google account and authorize the app.

Step 3: You'll be redirected to localhost:3000/callback
        (If the page doesn't load, copy the 'code' parameter from the URL)

Waiting for authorization...
`);

  // Start local server to catch the callback
  const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);

    if (parsedUrl.pathname === '/callback') {
      const code = parsedUrl.query.code;

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
              <h1>Authorization successful!</h1>
              <p>You can close this window and return to the terminal.</p>
            </body>
          </html>
        `);

        try {
          const { tokens } = await oauth2Client.getToken(code);

          console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    SUCCESS!                                    ║
╚════════════════════════════════════════════════════════════════╝

Your refresh token has been generated.

╔════════════════════════════════════════════════════════════════╗
║ REFRESH TOKEN (save this!):                                    ║
╠════════════════════════════════════════════════════════════════╣
${tokens.refresh_token}
╚════════════════════════════════════════════════════════════════╝

Now store these as Firebase secrets by running:

  firebase functions:secrets:set GMAIL_CLIENT_ID
  (enter: ${CLIENT_ID})

  firebase functions:secrets:set GMAIL_CLIENT_SECRET
  (enter: ${CLIENT_SECRET})

  firebase functions:secrets:set GMAIL_REFRESH_TOKEN
  (enter the refresh token above)

Then deploy your functions:
  cd functions && npm install && cd ..
  firebase deploy --only functions

`);
        } catch (error) {
          console.error('Error getting tokens:', error.message);
        }

        server.close();
        process.exit(0);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<html><body><h1>Error: No code received</h1></body></html>');
      }
    }
  });

  server.listen(3000, () => {
    console.log('Local server listening on http://localhost:3000');
  });

  // Also provide manual code entry option
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\nOr paste the authorization code here manually (press Enter to wait for redirect): ', async (code) => {
    if (code && code.trim()) {
      try {
        const { tokens } = await oauth2Client.getToken(code.trim());

        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    SUCCESS!                                    ║
╚════════════════════════════════════════════════════════════════╝

Your refresh token:
${tokens.refresh_token}

Store it as a Firebase secret:
  firebase functions:secrets:set GMAIL_REFRESH_TOKEN

`);
      } catch (error) {
        console.error('Error getting tokens:', error.message);
      }

      server.close();
      rl.close();
      process.exit(0);
    }
  });
}

main().catch(console.error);
