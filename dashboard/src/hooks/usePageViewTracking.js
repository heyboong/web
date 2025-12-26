import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAuthContext } from 'app/contexts/auth/context';

/**
 * Custom hook for tracking page views across all pages
 * Automatically tracks page views when user navigates to any page
 */
export function usePageViewTracking() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthContext();

  useEffect(() => {
    // Only track if user is authenticated
    if (!isAuthenticated || !user) return;

    // Track page view for the current route
    const trackPageView = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Get the current page name from the pathname
        const pageName = location.pathname.replace('/', '').replace(/\//g, '-') || 'home';
        
        await fetch('/api/analytics/track-page-view', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page: pageName,
            duration: 0
          })
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    // Track page view when location changes
    trackPageView();
  }, [location.pathname, isAuthenticated, user]);
}

export default usePageViewTracking;
