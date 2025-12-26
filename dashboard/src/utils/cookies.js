// Cookie utility functions

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration days (default: 7)
 * @param {string} path - Cookie path (default: '/')
 */
export const setCookie = (name, value, days = 7, path = '/') => {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  const cookieString = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}`;
  document.cookie = cookieString;
};

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 * @param {string} path - Cookie path (default: '/')
 */
export const deleteCookie = (name, path = '/') => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
};

/**
 * Save registered username for auto-fill
 * @param {string} username - Username to save
 */
export const saveRegisteredUsername = (username) => {
  setCookie('registeredUsername', username, 7);
};

/**
 * Get registered username and clear it
 * @returns {string|null} - Username or null if not found
 */
export const getAndClearRegisteredUsername = () => {
  const username = getCookie('registeredUsername');
  if (username) {
    deleteCookie('registeredUsername');
    return decodeURIComponent(username);
  }
  return null;
};
