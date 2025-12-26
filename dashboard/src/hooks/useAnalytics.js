import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAuthContext } from 'app/contexts/auth/context';

// Analytics tracking hook
export const useAnalytics = () => {
  const { isAuthenticated, user } = useAuthContext();
  const location = useLocation();

  // Track page view
  const trackPageView = useCallback(async (page = null) => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/analytics/track-page-view', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: page || location.pathname,
          duration: 0
        })
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, [isAuthenticated, user, location.pathname]);

  // Track login
  const trackLogin = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/analytics/track-login', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      if (result.status === 'success' && result.pointsAwarded > 0) {
        console.log(`🎉 You earned ${result.pointsAwarded} points for logging in!`);
      }
    } catch (error) {
      console.error('Failed to track login:', error);
    }
  }, [isAuthenticated, user]);

  // Track tool usage
  const trackToolUsage = useCallback(async (toolId, duration = 0, success = true, notes = '') => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/analytics/track-tool-usage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolId,
          duration,
          success,
          notes
        })
      });
    } catch (error) {
      console.error('Failed to track tool usage:', error);
    }
  }, [isAuthenticated, user]);

  // Track registration
  const trackRegistration = useCallback(async (userId) => {
    try {
      const response = await fetch('/api/analytics/track-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();
      if (result.status === 'success' && result.pointsAwarded > 0) {
        console.log(`🎉 Welcome! You earned ${result.pointsAwarded} points for registering!`);
      }
    } catch (error) {
      console.error('Failed to track registration:', error);
    }
  }, []);

  // Auto-track page views on route changes
  useEffect(() => {
    if (isAuthenticated && user) {
      trackPageView();
    }
  }, [location.pathname, trackPageView, isAuthenticated, user]);

  return {
    trackPageView,
    trackLogin,
    trackToolUsage,
    trackRegistration,
  };
};

export default useAnalytics;
