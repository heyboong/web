// Avatar utility functions

/**
 * Get avatar URL with fallback to default avatar
 * @param {string|null} avatar - Avatar path from database
 * @param {string} username - Username for fallback avatar
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (avatar, username = 'User') => {
  // If user has a custom avatar, return it
  if (avatar && avatar.trim() !== '') {
    // If it's already a full URL, return as is
    if (avatar.startsWith('http')) {
      return avatar;
    }
    // If it's a relative path, make it absolute with the current domain
    if (avatar.startsWith('/')) {
      // Use the current domain for avatar URLs
      const baseUrl = window.location.origin;
      return `${baseUrl}${avatar}`;
    }
    return `/${avatar}`;
  }

  // Fallback to default avatar with user's initial
  const initial = username.charAt(0).toUpperCase();
  return getDefaultAvatarUrl(initial);
};

/**
 * Generate default avatar URL with user's initial
 * @param {string} initial - User's initial (first letter of username)
 * @returns {string} Default avatar URL
 */
export const getDefaultAvatarUrl = (initial) => {
  // Create a simple SVG-based avatar with the user's initial
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#grad)" rx="50"/>
      <text x="100" y="120" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="white">${initial}</text>
    </svg>
  `;
  
  // Convert SVG to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
  return dataUrl;
};

/**
 * Get avatar props for React components
 * @param {string|null} avatar - Avatar path from database
 * @param {string} username - Username for fallback
 * @param {string} className - CSS class name
 * @param {string} alt - Alt text for image
 * @returns {object} Props for avatar image
 */
export const getAvatarProps = (avatar, username = 'User', className = '', alt = '') => {
  const avatarUrl = getAvatarUrl(avatar, username);
  const altText = alt || `${username}'s avatar`;
  
  return {
    src: avatarUrl,
    alt: altText,
    className: className,
    onError: (e) => {
      // Fallback to default avatar if image fails to load
      e.target.src = getDefaultAvatarUrl(username.charAt(0).toUpperCase());
    }
  };
};
