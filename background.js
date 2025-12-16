// background.js

// UTF-8 compatible Base64 encoder
function utf8_to_b64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'UPLOAD_FILE') {
    console.log('BFEHub [Background]: UPLOAD_FILE received', request.data);
    handleUpload(request.data, sendResponse);
    return true; // Keep the message channel open for async response
  }
});

async function handleUpload(data, sendResponse) {
  const { filename, code } = data;

  try {
    // 1. Get Settings
    const { githubToken, repoName, username } = await chrome.storage.local.get(['githubToken', 'repoName', 'username']);

    if (!githubToken || !repoName || !username) {
      throw new Error('Missing configuration. Please check extension settings.');
    }

    const path = filename; // We can add directory structure later if needed, e.g., `solutions/${filename}`
    const url = `https://api.github.com/repos/${username}/${repoName}/contents/${path}`;

    // 2. Check if file exists to get SHA
    let sha = null;
    const getRes = await fetch(url, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    } else if (getRes.status !== 404) {
      throw new Error(`Error checking file: ${getRes.status}`);
    }

    // 3. Create or Update File
    const contentEncoded = utf8_to_b64(code);
    const message = `Add solution for ${filename.replace('.js', '')}`; // Commit message

    const putBody = {
      message: message,
      content: contentEncoded,
      branch: 'main' // default branch
    };

    if (sha) {
      putBody.sha = sha;
      putBody.message = `Update solution for ${filename.replace('.js', '')}`;
    }

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(putBody)
    });

    if (!putRes.ok) {
      const errorJson = await putRes.json();
      throw new Error(`Upload failed: ${errorJson.message || putRes.statusText}`);
    }

    sendResponse({ success: true });

  } catch (error) {
    console.error('BFEHub Upload Error:', error);
    sendResponse({ success: false, error: error.message });
  }
}
