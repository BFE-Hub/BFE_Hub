// background.js

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
    console.log('BFEHub [Background]: UPLOAD_FILE received', request.data);
    handleUpload(request.data, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

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
