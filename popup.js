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
    loginButton.disabled = true;
    loginButton.innerText = 'Authenticating...';
    
    // Delegate login to background script to persist through popup closure
    chrome.runtime.sendMessage({ action: 'LOGIN' }, (response) => {
        if (chrome.runtime.lastError) {
             console.error(chrome.runtime.lastError);
             statusDisplay.innerText = 'Error: ' + chrome.runtime.lastError.message;
             statusDisplay.className = 'error';
             loginButton.disabled = false;
             loginButton.innerText = 'Sign in with GitHub';
             return;
        }

        if (response && response.success) {
            // Success - Storage should be updated by background
            chrome.storage.local.get(['githubToken', 'username', 'repoName'], (data) => {
                if (data.githubToken) {
                    showLoggedIn(data.username, data.repoName);
                }
            });
        } else {
             statusDisplay.innerText = 'Auth Failed: ' + (response ? response.error : 'Unknown');
             statusDisplay.className = 'error';
             loginButton.disabled = false;
             loginButton.innerText = 'Sign in with GitHub';
        }
    });
  });

  // Logout Logic
  document.getElementById('logout-btn')?.addEventListener('click', () => {
      chrome.storage.local.clear(() => {
          location.reload();
      });
  });

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
    
    usernameDisplay.innerText = username;
    repoDisplay.innerText = repoName;
    
    statusDisplay.innerText = 'Connected successfully ✅';
    statusDisplay.className = 'success';
  }
});
