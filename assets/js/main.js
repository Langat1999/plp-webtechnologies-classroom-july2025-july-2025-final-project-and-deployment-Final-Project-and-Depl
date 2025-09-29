// Shared helpers for pages
function setActiveNav() {
  const path = location.pathname.split('/').pop();
  const map = {
    'index.html': 'nav-home',
    'recipe-recommender.html': 'nav-sdg2',
    'mood-journal.html': 'nav-sdg3',
    'study-buddy.html': 'nav-sdg4'
  };
  const id = map[path] || 'nav-home';
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

document.addEventListener('DOMContentLoaded', setActiveNav);

// Enhanced API helper with better error handling, retry logic, and support for multiple methods
const API_BASE = 'http://localhost:5000';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

async function apiCall(method, path, body = null, retryCount = 0) {
  try {
    const options = {
      method: method.toUpperCase(),
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${path}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`API Error (${response.status}): ${errorText}`);
      
      // Retry on server errors (5xx) or network issues
      if ((response.status >= 500 || response.status === 0) && retryCount < MAX_RETRIES) {
        console.warn(`Retrying API call (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return await apiCall(method, path, body, retryCount + 1);
      }
      
      throw error;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error('API Call Failed:', error);
    
    // Check if backend is running
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.warn('Backend server may not be running. Using fallback data.');
    }
    
    throw error; // Re-throw to allow individual pages to handle errors
  }
}

// Convenience methods
async function apiGet(path) {
  return await apiCall('GET', path);
}

async function apiPost(path, body) {
  return await apiCall('POST', path, body);
}

async function apiPut(path, body) {
  return await apiCall('PUT', path, body);
}

async function apiDelete(path) {
  return await apiCall('DELETE', path);
}

// Utility function to show loading state
function showLoading(button, text = 'Loading...') {
  const originalText = button.textContent;
  button.textContent = text;
  button.disabled = true;
  return () => {
    button.textContent = originalText;
    button.disabled = false;
  };
}

// Utility function to show error message
function showError(message, container = null) {
  console.error('Error:', message);
  if (container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 4px; margin: 10px 0;';
    container.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  } else {
    alert(`Error: ${message}`);
  }
}





// Learn More toggle functionality
function toggleLearnMore() {
  const button = document.getElementById('learn-more-btn');
  const content = document.getElementById('learn-more-content');
  
  if (!button || !content) return;
  
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  
  // Toggle visibility
  if (isExpanded) {
    // Hide content
    content.style.display = 'none';
    content.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = 'Learn More ⌄';
  } else {
    // Show content
    content.style.display = 'block';
    content.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    button.innerHTML = 'Show Less ⌃';
    
    // Smooth scroll to the content if it's below the fold
    content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Remove unload event listener to comply with permissions policy and avoid bfcache issues
// The unload event is not allowed in this document, so we remove it or avoid using it
// No unload event listener added here to prevent violations

// Use pagehide event to save state if needed, but do not block bfcache
window.addEventListener('pagehide', function(event) {
  if (event.persisted) {
    // Page is being put into bfcache, save any necessary state here
  }
});

// Initialize Learn More functionality
function initLearnMore() {
  const button = document.getElementById('learn-more-btn');
  const content = document.getElementById('learn-more-content');
  
  if (button && content) {
    button.addEventListener('click', toggleLearnMore);
    
    // Add keyboard accessibility
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleLearnMore();
      }
    });
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  initLearnMore();
});






