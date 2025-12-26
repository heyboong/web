// Navigation utility functions

/**
 * Navigate to a URL with proper validation and error handling
 * @param {string} url - URL to navigate to
 * @param {number} delay - Delay in milliseconds before navigation (default: 0)
 */
export const navigateTo = (url, delay = 0) => {
  // Validate URL
  if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
    url = '/dashboards/home';
  }
  
  // Ensure URL starts with /
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // Clean up current URL parameters
  const cleanUrl = window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
  
  // Navigate with delay if specified
  if (delay > 0) {
    setTimeout(() => {
      window.location.href = url;
    }, delay);
  } else {
    window.location.href = url;
  }
};

/**
 * Get redirect URL from URL parameters with fallback
 * @param {string} fallback - Fallback URL if no redirect parameter (default: '/dashboards/home')
 * @returns {string} - Valid redirect URL
 */
export const getRedirectUrl = (fallback = '/dashboards/home') => {
  const urlParams = new URLSearchParams(window.location.search);
  let redirectTo = urlParams.get('redirect');
  
  // Validate redirect URL
  if (!redirectTo || redirectTo === 'null' || redirectTo === 'undefined' || redirectTo.trim() === '') {
    redirectTo = fallback;
  }
  
  // Ensure redirect starts with /
  if (!redirectTo.startsWith('/')) {
    redirectTo = '/' + redirectTo;
  }
  
  return redirectTo;
};
