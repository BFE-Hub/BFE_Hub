// Store the latest submission data
let latestSubmission = null;

// Listen for messages from inject.js
window.addEventListener('message', (event) => {
  // Security check: only accept messages from the same window
  if (event.source !== window) return;

  if (event.data.type === 'BFE_SUBMISSION') {
    console.log('BFE_Hub [Content]: Submission detected', event.data.data);
    latestSubmission = event.data.data;
    // Reset spinner if it exists from previous attempts, or keeps it until new one?
    // User wants checkmark to stay. But if I submit again, it should probably clear?
    // Let's clear it when new submission starts.
    if (spinnerElement) {
        spinnerElement.remove();
        spinnerElement = null;
    }
  }

  if (event.data.type === 'BFE_SUCCESS') {
    console.log('BFEHub [Content]: Success detected');
    if (latestSubmission) {
      console.log('BFEHub [Content]: Triggering handleSuccess');
      handleSuccess();
    } else {
      console.warn('BFEHub [Content]: Success detected but no submission data found.');
    }
  }
});

function handleSuccess() {
  if (!latestSubmission) return;
  
  // Start observing DOM to find the success modal
  observeModal();
  
  // Trigger upload to Background
  const filename = `${latestSubmission.permalink}.js`;
  const code = latestSubmission.code;

  // We wait for the spinner insertion before notifying user effectively?
  // Actually, we should trigger upload immediately, but update UI reflectively.
  
  // Scrape Metadata
  const metadata = scrapeMetadata();
  const title = metadata.title || 'Unknown Problem';
  const category = metadata.category || 'Misc';
  const description = metadata.description || '';

  // Let's fire upload.
  try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'UPLOAD_FILE',
            data: { 
                filename, 
                code,
                permalink: latestSubmission.permalink,
                title,
                category,
                description
            }
          }, (response) => {
            // Check for lastError to avoid unchecked runtime.lastError
            if (chrome.runtime.lastError) {
                // If context invalidation happens during callback (rare but possible) or other error
                const msg = chrome.runtime.lastError.message;
                console.error('BFEHub: Runtime error', msg);
                if (msg.includes('Extension context invalidated')) {
                    alert('BFEHub 업데이트됨: 페이지를 새로고침 해주세요.');
                }
                return;
            }
            if (response && response.success) {
              console.log('BFEHub: Upload success');
              markUiSuccess();
            } else {
              console.error('BFEHub: Upload failed', response ? response.error : 'Unknown error');
            }
          });
      } else {
          throw new Error('Extension context invalidated');
      }
  } catch (e) {
      console.error('BFEHub Context Error:', e);
      if (e.message.includes('Extension context invalidated')) {
          alert('BFEHub: 확장 프로그램이 업데이트 되었습니다. 페이지를 새로고침 해주세요!');
      }
  }
}

function scrapeMetadata() {
    try {
        // 1. Category (Breadcrumb)
        // Look for link that contains "/problem" in href, usually the second item in breadcrumb
        // Structure: Home > Category > Problem
        // Strategy: Find all 'a' with href starting with /problem
        let category = 'Uncategorized';
        const breadcrumbs = Array.from(document.querySelectorAll('a[href^="/problem"]'));
        // Usually the first one is "All problems" or category.
        // Let's pick the one that is NOT the current problem (current problem also has href=/problem/...)
        // BFE structure: Home > JavaScript > implement curry
        // "JavaScript" link is /problem?tag=... or /problem
        // Let's try to get the text of the element before the last one?
        // Or generic approach: find element with class 'Breadcrumb' if exists, or regex href.
        
        // Simpler: Use the provided strategy - look for specific class or just the logical position.
        // The prompt suggested: document.querySelector('a[href="/problem"]')
        const categoryEl = document.querySelector('a[href="/problem"]');
        if (categoryEl) {
            category = categoryEl.textContent.trim();
        }

        // 2. Title (H1)
        let title = '';
        const h1 = document.querySelector('h1');
        if (h1) {
            title = h1.textContent.split('.').pop().trim(); // Remove number "1. implement curry" -> "implement curry"? 
            // Actually user might want full title "1. implement curry". Let's keep it full for now or prompt didn't specify.
            // Prompt: "Problem Title (문제 제목)"
            title = h1.textContent.trim();
        }

        // 3. Description
        // Target: <div class="MarkdownView-sc-c8iam-0 ...">
        // Start with class selector partial match
        let description = '';
        const descEl = document.querySelector('[class*="MarkdownView"]');
        if (descEl) {
            // Clone to modify
            const clone = descEl.cloneNode(true);
            
            // Process code blocks (shiki)
            // BFE uses Shiki which renders as <pre class="shiki ..."><code><span class="line">...</span></code></pre>
            // We need to extract the raw text from lines to preserve indentation
            const shikiBlocks = clone.querySelectorAll('.shiki');
            shikiBlocks.forEach(block => {
                let codeText = '';
                const lines = block.querySelectorAll('.line');
                
                if (lines.length > 0) {
                   lines.forEach(line => {
                       // innerText usually preserves indentation if CSS whitespace is pre
                       // but textContent might not if spans are used for spacing.
                       // Shiki uses spans for colors, text is usually there.
                       // Let's try textContent. BFE usually puts `&nbsp;` or raw spaces in spans.
                       // Check if line text content ends with newline? No, usually block level.
                       codeText += line.textContent + '\n';
                   });
                } else {
                   // Fallback if no .line class
                   codeText = block.textContent;
                }
                
                // Replace with clean <pre><code>
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = codeText; // Safe text
                pre.appendChild(code);
                block.replaceWith(pre);
            });

            description = clone.innerHTML;
        } else {
            // Fallback: finding the largest text block or specific container
            // Maybe look for sibling of H1?
        }

        console.log('BFEHub: Scraped Metadata', { category, title });
        return { category, title, description };

    } catch (e) {
        console.error('BFEHub: Scraping failed', e);
        return {};
    }
}

function observeModal() {
  // MutationObserver to look for h6 "👍 Well Done!"
  const observer = new MutationObserver((mutations, obs) => {
    const h6 = findWellDoneHeader();
    if (h6) {
      injectSpinner(h6);
      obs.disconnect(); // Stop observing once found and injected
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Fallback: Check immediately in case it's already there
  const h6 = findWellDoneHeader();
  if (h6) injectSpinner(h6);
}

function findWellDoneHeader() {
  // Look for h6 containing "Well Done"
  // BFE.dev success modal: h6 text is usually "👍 Well Done!"
  const headers = document.querySelectorAll('h6');
  for (let h of headers) {
    if (h.textContent.includes('Well Done')) {
      return h;
    }
  }
  return null;
}

let spinnerElement = null;

function injectSpinner(targetElement) {
  if (spinnerElement) return; // Already injected

  // Create Spinner
  spinnerElement = document.createElement('span');
  spinnerElement.style.marginLeft = '10px';
  spinnerElement.style.display = 'inline-block';
  spinnerElement.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
      <style>
        .spinner_V8m1{transform-origin:center;animation:spinner_zKoa 2s linear infinite}
        .spinner_V8m1 circle{stroke-linecap:round;animation:spinner_YpZS 1.5s ease-in-out infinite}
        @keyframes spinner_zKoa{100%{transform:rotate(360deg)}}
        @keyframes spinner_YpZS{0%{stroke-dasharray:0 150;stroke-dashoffset:0}47.5%{stroke-dasharray:42 150;stroke-dashoffset:-16}95%,100%{stroke-dasharray:42 150;stroke-dashoffset:-59}}
      </style>
      <g class="spinner_V8m1">
        <circle cx="12" cy="12" r="9.5" fill="none" stroke-width="3" stroke="#2ea44f"></circle>
      </g>
    </svg>
  `;
  
  targetElement.parentNode.insertBefore(spinnerElement, targetElement.nextSibling);
}

function markUiSuccess() {
  // Wait for spinner to be injected if it hasn't been yet (race condition possible if upload is super fast)
  // We can poll a bit or just update if it exists.
  
  const checkInterval = setInterval(() => {
    if (spinnerElement) {
      clearInterval(checkInterval);
      // Replace with SVG Icon
      spinnerElement.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#78f000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>
      `; 
   
      spinnerElement.style.display = 'inline-flex';
      spinnerElement.style.alignItems = 'center';
      spinnerElement.style.marginLeft = '8px';
    }
  }, 100); 
}
