document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('login-btn');
  const loginView = document.getElementById('login-view');
  const loggedInView = document.getElementById('logged-in-view');
  const usernameDisplay = document.getElementById('username');
  const repoDisplay = document.getElementById('repo-name');
  const statusDisplay = document.getElementById('status');
  
  // Repo Edit UI
  const repoViewMode = document.getElementById('repo-view-mode');
  const repoEditMode = document.getElementById('repo-edit-mode');
  const editRepoBtn = document.getElementById('edit-repo-btn');
  const saveRepoBtn = document.getElementById('save-repo-btn');
  const cancelRepoBtn = document.getElementById('cancel-repo-btn');
  const repoInput = document.getElementById('repo-input');

  
  const AUTH_SERVER_URL = 'https://bfehub-server.vercel.app/api/authenticate'; // Short (aliased) URL for cleaner look
  // Or 'https://bfehub-server-3ez0p6fh5-y-minions-projects.vercel.app/api/authenticate';
  
 
  const CLIENT_ID = 'Ov23li2iiQ7dfdHfA7V8'; 

  // Check login state
  chrome.storage.local.get(['githubToken', 'username', 'repoName'], (data) => {
    if (data.githubToken) {
      showLoggedIn(data.username, data.repoName);
    }
  });

  // Edit UI Logic
  editRepoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      repoViewMode.classList.add('hidden');
      repoEditMode.classList.remove('hidden');
      repoInput.value = repoDisplay.textContent;
  });

  cancelRepoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      repoViewMode.classList.remove('hidden');
      repoEditMode.classList.add('hidden');
  });

  saveRepoBtn.addEventListener('click', async () => {
      const newRepoName = repoInput.value.trim();
      if (!newRepoName) return;
      
      saveRepoBtn.disabled = true;
      saveRepoBtn.innerText = '...';

      try {
          const { githubToken, username } = await chrome.storage.local.get(['githubToken', 'username']);
          if (!githubToken) throw new Error('Not logged in');

          // Check/Create Repo
          await checkOrCreateRepo(githubToken, username, newRepoName);
          
          // Update Storage
          await chrome.storage.local.set({ repoName: newRepoName });
          
          // Update UI
          repoDisplay.textContent = newRepoName;
          repoViewMode.classList.remove('hidden');
          repoEditMode.classList.add('hidden');
          
          statusDisplay.innerText = 'Repository updated!';
          statusDisplay.className = 'success';
          setTimeout(() => { statusDisplay.innerText = 'Connected successfully ✅'; }, 2000);

      } catch (e) {
          console.error(e);
          alert('Failed to update repo: ' + e.message);
      } finally {
          saveRepoBtn.disabled = false;
          saveRepoBtn.innerText = 'Save';
      }
  });

  loginButton.addEventListener('click', () => {
    const redirectUri = chrome.identity.getRedirectURL(); // https://<AppID>.chromiumapp.org/
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo&redirect_uri=${redirectUri}`;

    console.log('Starting Auth Flow:', authUrl);

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, async (redirectUrl) => {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error('Auth Flow Error:', chrome.runtime.lastError);
        alert('Login failed: ' + (chrome.runtime.lastError?.message || 'Unknown error'));
        return;
      }

      // Parse code from redirectUrl
      // URL format: https://<AppID>.chromiumapp.org/?code=...
      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');

      if (!code) {
        alert('Login failed: No code received.');
        return;
      }

      // Exchange code for token via Backend
      try {
        loginButton.disabled = true;
        loginButton.innerText = 'Verifying...';

        const response = await fetch(AUTH_SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'Token exchange failed');
        }

        const data = await response.json();
        const token = data.token;

        // Perform initial setup (fetch user, create repo)
        await performSetup(token);

      } catch (error) {
        console.error(error);
        alert('Authentication Error: ' + error.message);
        loginButton.disabled = false;
        loginButton.innerText = 'Sign in with GitHub';
      }
    });
  });

  async function performSetup(token) {
    try {
       // 1. Get User Info
       const userRes = await fetch('https://api.github.com/user', {
         headers: { 'Authorization': `token ${token}` }
       });
       if(!userRes.ok) throw new Error('Failed to fetch user info');
       const user = await userRes.json();
       
       const username = user.login;
       const repoName = 'bfe-solutions'; // Default

       // 2. Check/Create Repo
       await checkOrCreateRepo(token, username, repoName);

       // 3. Save
       chrome.storage.local.set({
         githubToken: token,
         username: username,
         repoName: repoName
       }, () => {
         showLoggedIn(username, repoName);
       });

    } catch(e) {
       console.error(e);
       alert('Setup Error: ' + e.message);
    }
  }

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
              description: 'Solutions from BFE.dev via BFEHub'
            })
          });
          
          if (!createRes.ok) {
              throw new Error('Failed to create repository');
          }
       } else if (!repoRes.ok) {
           throw new Error('Repo check failed');
       }
  }

  function showLoggedIn(username, repoName) {
    loginView.classList.add('hidden');
    loggedInView.classList.remove('hidden');
    usernameDisplay.textContent = username;
    repoDisplay.textContent = repoName || 'bfe-solutions';
    statusDisplay.textContent = 'Connected successfully ✅';
    statusDisplay.className = 'success';
  }
});
