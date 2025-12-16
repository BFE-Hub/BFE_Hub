document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('token');
  const repoInput = document.getElementById('repo');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.local.get(['githubToken', 'repoName'], (result) => {
    if (result.githubToken) tokenInput.value = result.githubToken;
    if (result.repoName) repoInput.value = result.repoName;
  });

  saveButton.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    const repoName = repoInput.value.trim();

    if (!token || !repoName) {
      showStatus('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Validate Token & Get User Info
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!userRes.ok) {
        throw new Error('Invalid Token');
      }

      const user = await userRes.json();
      const username = user.login;

      // 2. Check if Repo Exists
      const repoRes = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      // 3. Create Repo if it doesn't exist
      if (repoRes.status === 404) {
        showStatus('Creating repository...', 'success'); // API call is fast but nice to give feedback
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repoName,
            auto_init: true,
            private: false, // Default to public, matching typical behavior
            description: 'Solutions from BFE.dev via BFEHub'
          })
        });

        if (!createRes.ok) {
          throw new Error('Failed to create repository');
        }
      } else if (!repoRes.ok) {
        throw new Error('Error checking repository');
      }

      // 4. Save Settings
      chrome.storage.local.set({
        githubToken: token,
        repoName: repoName,
        username: username
      }, () => {
        showStatus('Connected successfully! Settings saved.', 'success');
      });

    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setLoading(false);
    }
  });

  function showStatus(text, type) {
    statusDiv.textContent = text;
    statusDiv.className = type;
    setTimeout(() => {
      if (type === 'success') {
        // statusDiv.textContent = ''; // keep success message for a bit
      }
    }, 3000);
  }

  function setLoading(isLoading) {
    saveButton.disabled = isLoading;
    saveButton.textContent = isLoading ? 'Connecting...' : 'Save & Connect';
  }
});
