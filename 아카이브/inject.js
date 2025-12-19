console.log('BFE_Hub: Inject script loaded + XHR Support (Fetch & XHR).'); // This should appear if script runs.

// XHR Override
(function() {
  const XHR = XMLHttpRequest.prototype;

  const open = XHR.open;
  const send = XHR.send;
  // const setRequestHeader = XHR.setRequestHeader;

  XHR.open = function(method, url) {
    this._method = method;
    this._url = url;
    // console.log('BFEHub XHR Open:', method, url);
    return open.apply(this, arguments);
  };

  XHR.send = function(postData) {
    // console.log('BFEHub XHR Send:', this._method, this._url);
    
    this.addEventListener('load', function() {
      const url = this._url;
      const method = this._method;
      
      // 1. Detect Code Submission (POST)
      if (url.includes('/api/code/v1/submit') && method.toUpperCase() === 'POST') {
        // console.log('BFEHub: XHR Submission POST detected', url);
        if (postData) {
           let parsedBody = postData;
           if (typeof postData === 'string') {
               try {
                   parsedBody = JSON.parse(postData);
               } catch(e) { /* ignore */ }
           }
           
           if (parsedBody && parsedBody.files && parsedBody.files.length > 0) {
               console.log('BFEHub: XHR - Found code payload');
               window.postMessage({
                   type: 'BFE_SUBMISSION',
                   data: {
                       code: parsedBody.files[0].code,
                       permalink: parsedBody.permalink
                   }
               }, '*');
           }
        }
      }
      
      // 2. Detect Polling Result (GET)
      if (url.includes('/result?id=')) {
          // console.log('BFEHub: XHR Polling detected', url);
          try {
             if (this.responseText) {
                 const data = JSON.parse(this.responseText);
                 // console.log('BFEHub: XHR Polling Response', data);
                 if (data && data.status === 'finished' && data.result && data.result.passed === true) {
                    console.log('BFEHub: XHR - SUBMISSION PASSED!');
                    window.postMessage({
                        type: 'BFE_SUCCESS'
                    }, '*');
                 }
             }
          } catch(e) {
              // console.error('BFEHub: XHR JSON Parse Error', e);
          }
      }
    });

    return send.apply(this, arguments);
  };
})();

// Fetch Override (Keep it just in case, but XHR seems to be the one)
(function() {
  const originalFetch = window.fetch;
  // ... existing fetch code ...


  window.fetch = async function(...args) {
    // console.log('BFEHub: Fetch intercepted', args[0]); // Very noisy if enabled
    const response = await originalFetch(...args);

    try {
      const respClone = response.clone();
      
      let url = '';
      let method = 'GET';
      let body = null;

      const [resource, config] = args;

      if (typeof resource === 'string') {
        url = resource;
      } else if (resource instanceof Request) {
        url = resource.url;
      }

      if (config) {
        if (config.method) method = config.method;
        body = config.body;
      } else if (resource instanceof Request) {
        method = resource.method;
      }

      // Check URL patterns
      // Relaxed check: just 'submit'
      if (url.includes('/submit')) {
         
         if (method.toUpperCase() === 'POST' && url.includes('/api/code/v1/submit')) {
            console.log('BFEHub: Processing POST submission', url);
            if (body) {
                // If body is a string, parse it
                let parsedBody = body;
                if (typeof body === 'string') {
                    try {
                        parsedBody = JSON.parse(body);
                    } catch(e) {
                         console.warn('BFEHub: Body parse failed', e);
                    }
                }
                
                console.log('BFEHub: Body content:', parsedBody);

                if (parsedBody && parsedBody.files && parsedBody.files.length > 0) {
                     console.log('BFEHub: Found code payload');
                     window.postMessage({
                        type: 'BFE_SUBMISSION',
                        data: {
                            code: parsedBody.files[0].code,
                            permalink: parsedBody.permalink
                        }
                    }, '*');
                } else {
                   console.log('BFEHub: No files found in body');
                }
            } else {
               console.log('BFEHub: No body in POST');
            }
         } else if (url.includes('/api/code/v1/submit/result')) {
             // Polling result
             console.log('BFEHub: Detected Result Polling', url);
             respClone.json().then(data => {
                console.log('BFEHub: Result polling data', data);
                // Check structure: { status: 'finished', result: { passed: true, ... } }
                if (data && data.status === 'finished' && data.result && data.result.passed === true) {
                    console.log('BFEHub: SUBMISSION PASSED!');
                    window.postMessage({
                        type: 'BFE_SUCCESS'
                    }, '*');
                } else {
                   console.log('BFEHub: Not passed yet', data.status, data.result?.passed);
                }
             }).catch(e => console.error('BFEHub: Failed to parse result JSON', e));
         }
      }

    } catch (err) {
      console.error('BFEHub Inject Error:', err);
    }

    return response;
  };
})();

