(function() {
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    try {
      // Clone response to read body without consuming it for the page
      const clone = response.clone();
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : resource.url;

      // 1. Detect Code Submission (POST)
      // URL contains /api/code/v1/submit and method is POST
      if (url.includes('/api/code/v1/submit') && config && config.method === 'POST') {
        if (config.body) {
          const body = JSON.parse(config.body);
          if (body && body.files && body.files.length > 0 && body.permalink) {
            window.postMessage({
              type: 'BFE_SUBMISSION',
              data: {
                code: body.files[0].code,
                permalink: body.permalink
              }
            }, '*');
          }
        }
      }

      // 2. Detect Polling Result (GET)
      // URL contains /api/code/v1/submit/result?id=
      if (url.includes('/api/code/v1/submit/result?id=')) {
        clone.json().then(data => {
          if (data && data.status === 'finished' && data.result && data.result.passed === true) {
            window.postMessage({
              type: 'BFE_SUCCESS'
            }, '*');
          }
        }).catch(() => {}); // Ignore json parse errors
      }

    } catch (err) {
      console.error('BFEHub Inject Error:', err);
    }

    return response;
  };
})();
