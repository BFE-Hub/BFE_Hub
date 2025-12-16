// Store the latest submission data
let latestSubmission = null;

// Listen for messages from inject.js
window.addEventListener('message', (event) => {
  // Security check: only accept messages from the same window
  if (event.source !== window) return;

  if (event.data.type === 'BFE_SUBMISSION') {
    console.log('BFEHub: Submission detected');
    latestSubmission = event.data.data;
  }

  if (event.data.type === 'BFE_SUCCESS') {
    console.log('BFEHub: Success detected');
    if (latestSubmission) {
      handleSuccess();
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
  
  // But wait, the prompt says: "BFE_SUCCESS 메시지를 받으면 MutationObserver를 실행하여 ... 로딩 스피너를 삽입합니다."
  // And "GitHub 업로드가 완료되면 스피너를 초록색 체크 아이콘으로 변경".
  
  // So we need to coordinating the UI finding AND the background upload.
  
  // Let's do upload first (async) and UI finding in parallel?
  // Or find UI first? If modal takes time to appear, we should start upload anyway so it's fast.
  // But we need the Spinner to exist to turn it into Checkmark.
  
  // Let's fire upload.
  chrome.runtime.sendMessage({
    action: 'UPLOAD_FILE',
    data: { filename, code }
  }, (response) => {
    if (response && response.success) {
      console.log('BFEHub: Upload success');
      markUiSuccess();
    } else {
      console.error('BFEHub: Upload failed', response.error);
      // Optional: Show error state
    }
  });
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
      spinnerElement.innerHTML = '✅'; // Simple checkmark
      
      setTimeout(() => {
        if (spinnerElement) {
          spinnerElement.style.transition = 'opacity 0.5s';
          spinnerElement.style.opacity = '0';
          setTimeout(() => spinnerElement.remove(), 500);
          spinnerElement = null; // Reset for next submission
        }
      }, 3000);
    }
  }, 100); 
}
