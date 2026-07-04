// API helper for Vercel deployment
const CONFIG = {
  // Replace this with your Google Apps Script Web App URL after re-deploying
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwPl5nm8te4jO-e-qcStbYvGvD3HsPLFFTt67ze-0ipUlI73LmpgpWItPnIifN20qkx/exec'
};

function callBackend(action, args = []) {
  if (CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
    return Promise.reject(new Error("Please configure SCRIPT_URL in api.js before using the application."));
  }

  return fetch(CONFIG.SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({ action: action, args: args }),
    // Depending on GAS CORS, might need text/plain content type to avoid preflight
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success') {
      return data.data;
    } else {
      throw new Error(data.message || 'Unknown error from server');
    }
  });
}
