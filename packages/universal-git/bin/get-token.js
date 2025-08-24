// npm install open
import http from 'http';
import { URL } from 'url';
import open from 'open';

// --- CONFIGURATION ---
// PASTE YOUR GITHUB OAUTH APP CREDENTIALS HERE
// For security, it's better to load these from environment variables.
const GITHUB_CLIENT_ID = 'YOUR_CLIENT_ID';
const GITHUB_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

const PORT = 3000;
const CALLBACK_PATH = '/oauth/callback';
const CALLBACK_URL = `http://localhost:${PORT}${CALLBACK_PATH}`;
// --- END CONFIGURATION ---

/**
 * The main function that orchestrates the OAuth flow.
 * @returns {Promise<string>} A promise that resolves with the GitHub access token.
 */
export function getGitHubToken() {
  // We wrap the entire flow in a Promise to be resolved upon completion.
  return new Promise((resolve, reject) => {
    // 1. Spin up a localhost server
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);

      // We only care about requests to our specific callback path.
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404).end();
        return;
      }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.end('<h1>Authentication failed.</h1><p>You can close this window.</p>');
        server.close();
        reject(new Error(`OAuth Error: ${error}`));
        return;
      }

      if (!code) {
        res.end('<h1>Error: No code received.</h1><p>Please try again.</p>');
        server.close();
        reject(new Error('No OAuth code received in callback.'));
        return;
      }
      
      // 5. Exchange the temporary code for an access token
      try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code,
          }),
        });
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        if (!accessToken) {
            throw new Error('Access token not found in response from GitHub.');
        }

        // 6. Show a "close" message in the browser and resolve the promise
        res.end('<h1>Success!</h1><p>You are authenticated. You can close this tab now and return to the terminal.</p>');
        resolve(accessToken);

      } catch (err) {
        reject(err);
      } finally {
        // 7. Destroy the server
        server.close();
      }
    }).listen(PORT);

    server.on('listening', () => {
      // 2. Construct the GitHub authorization URL
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
      authUrl.searchParams.set('scope', 'repo,user'); // Request access to repositories and user profile

      // 3. Use the existing browser to log in
      console.log('Please login with GitHub in the browser window that just opened...');
      open(authUrl.toString());
    });
    
    server.on('error', (err) => reject(err));
  });
}

// Example of how to use the function
async function main() {
    try {
        console.log('Starting GitHub authentication...');
        const token = await getGitHubToken();
        console.log('\nAuthentication successful!');
        console.log('Received Access Token:', token);
        // Now you can use this token to make authenticated API requests.
    } catch (error) {
        console.error('\nAuthentication failed:', error.message);
    }
}

main();