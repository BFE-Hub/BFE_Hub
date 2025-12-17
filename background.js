// background.js

const AUTH_SERVER_URL = 'https://bfehub-server.vercel.app/api/authenticate';
const CLIENT_ID = 'Ov23li2iiQ7dfdHfA7V8';

// UTF-8 compatible Base64 encoder
function utf8_to_b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function sanitizePath(str) {
  // Replace unsafe chars with space or remove them.
  // Allowed: alphanumeric, space, dot, hyphen, underscore
  // We should trim dots and spaces slightly
  if (!str) return 'Unknown';
  return str.replace(/[\\/:*?"<>|]/g, ' ').trim();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'UPLOAD_FILE') {
    console.log('BFE_Hub [Background]: UPLOAD_FILE received', request.data);
    handleUpload(request.data, sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.action === 'LOGIN') {
    console.log('BFE_Hub [Background]: Starting LOGIN flow...');
    launchAuthFlow()
        .then(() => {
            console.log('BFE_Hub [Background]: LOGIN success');
            sendResponse({ success: true });
        })
        .catch(err => {
            console.error('BFE_Hub [Background]: Login Error', err);
            sendResponse({ error: err.message });
        });
    return true; // IMPORTANT: Keep channel open
  }
});

async function launchAuthFlow() {
    const redirectUri = chrome.identity.getRedirectURL(); 
    console.log('BFE_Hub [Background]: Redirect URI', redirectUri);
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=${redirectUri}`;
    console.log('BFE_Hub [Background]: Auth URL', authUrl);

    // Promise wrapper for launchWebAuthFlow to verify it's called
    const redirectUrl = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, (responseUrl) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (!responseUrl) {
                reject(new Error('Auth flow was canceled or failed.'));
            } else {
                resolve(responseUrl);
            }
        });
    });

    console.log('BFE_Hub [Background]: Redirect URL received', redirectUrl);
    // ... rest of the flow is correctly using async/await below ...
    
    // Existing code continues...
    const urlParams = new URL(redirectUrl).searchParams;
    const code = urlParams.get('code');
    if (!code) throw new Error('No OAuth code returned');

    // Exchange Code for Token
    const response = await fetch(AUTH_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
        throw new Error(data.error || 'Token exchange failed');
    }

    const token = data.token;

    // Get User Info
    const userRes = await fetch('https://api.github.com/user', {
         headers: { 'Authorization': `token ${token}` }
    });
    if (!userRes.ok) throw new Error('Failed to fetch user info');
    
    const user = await userRes.json();
    const username = user.login;
    // const repoName = 'bfe-solutions'; // Removed default auto-creation

    // Save to Storage - repoName is undefined/null initially
    await chrome.storage.local.set({
         githubToken: token,
         username: username,
         // repoName: repoName // Do not set default repo name
    });
}

// Ensure checkOrCreateRepo is exported or available for messages if needed? 
// Actually, popup.js handles the "Save" action which calls checkOrCreateRepo logic. 
// BUT, popup.js currently calls checkOrCreateRepo itself via fetch. 
// Wait, popup.js still has checkOrCreateRepo. 
// However, checking the user's previous request (Step 475), I moved repo logic to background but Popup still had it?
// Let's check popup.js content. 
// In Step 476, popup.js delegates LOGIN to background. 
// But when user clicks SAVE in edit mode, popup.js executes the logic.
// That is fine. Popup.js logic for 'Save' uses `checkOrCreateRepo` defined in `popup.js`?
// Yes, Step 476 shows `async function checkOrCreateRepo` is still in popup.js at the bottom.
// So removing it from `launchAuthFlow` in background.js is safe and correct.

// Only remove the auto-creation call. Keep the function definition if used elsewhere? 
// `checkOrCreateRepo` in background.js is NOT used elsewhere if I remove it from here.
// But wait, `handleUpload` might need to check if repo exists? 
// `handleUpload` assumes repo exists and just uploads. If not, it fails.
// So we can keep `checkOrCreateRepo` helper in background just in case we want to auto-create on upload? 
// Or just remove the call. I will remove the call in `launchAuthFlow`.

/* 
   We also need to expose a way to 'Link Repository' from popup safely? 
   Currently popup.js does it directly. That works. 
*/

async function checkOrCreateRepo(token, username, repoName) {
    const repoRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
         headers: { 'Authorization': `token ${token}` }
    });
       
    if (repoRes.status === 404) {
        // Create
        const createRes = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
              'Authorization': `token ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: repoName,
              auto_init: true,
              description: 'Solutions from BFE.dev via BFE_Hub'
            })
        });
        
        if (!createRes.ok) {
            throw new Error('Failed to create repository');
        }
    } else if (!repoRes.ok) {
         throw new Error('Repo check failed');
    }
}

async function handleUpload(data, sendResponse) {
  // filename was legacy input, we now expect permalink, code, metadata
  const { code, permalink, title, category, description } = data;

  try {
    // 1. Get Settings
    const { githubToken, repoName, username } = await chrome.storage.local.get(['githubToken', 'repoName', 'username']);

    if (!githubToken || !repoName || !username) {
      throw new Error('Missing configuration. Please check extension settings.');
    }
    
    // Construct Paths
    const safeCategory = sanitizePath(category);
    // Permalink is usually safe but let's be sure
    const safePermalink = sanitizePath(permalink);
    
    // File 1: Solution JS
    const jsPath = `${safeCategory}/${safePermalink}/${safePermalink}.js`;
    
    // File 2: README
    const readmePath = `${safeCategory}/${safePermalink}/README.md`;
    const readmeContent = `# ${title}\n\n## Description\n${description}`;

    // Upload sequential
    console.log(`BFEHub: Uploading ${jsPath}...`);
    await uploadFileToGitHub(username, repoName, jsPath, code, `Add solution for ${title}`, githubToken);
    
    console.log(`BFEHub: Uploading ${readmePath}...`);
    await uploadFileToGitHub(username, repoName, readmePath, readmeContent, `Add README for ${title}`, githubToken);

    sendResponse({ success: true });

  } catch (error) {
    console.error('BFEHub Upload Error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function uploadFileToGitHub(username, repoName, path, content, message, token) {
    const url = `https://api.github.com/repos/${username}/${repoName}/contents/${path}`;

    // Check if file exists to get SHA
    let sha = null;
    const getRes = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    } else if (getRes.status !== 404) {
      throw new Error(`Error checking file: ${getRes.status}`);
    }

    // Create or Update
    const contentEncoded = utf8_to_b64(content);

    const putBody = {
      message: message,
      content: contentEncoded,
      branch: 'main'
    };

    if (sha) {
      putBody.sha = sha;
      putBody.message = `Update ${path}`;
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errorJson = await putRes.json();
      throw new Error(`Upload failed for ${path}: ${errorJson.message || putRes.statusText}`);
    }
    
    return putRes;
}
