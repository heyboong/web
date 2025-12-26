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
import bcrypt from 'bcryptjs';
import { testConnection, executeQuery } from './src/utils/database.js';
import { apiConfig } from './src/configs/database.config.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  verifyToken,
  validatePassword,
  validateEmail,
  validateUsername 
} from './src/utils/auth.js';
import templateFieldsRouter from './src/api/routes/templates/fields.js';
import captureRouter from './src/api/routes/capture.js';
import websocketManager from './src/api/websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.API_PORT) || apiConfig.port || 2324;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com"],
      imgSrc: ["'self'", 'data:', 'https:', 'https://flagsapi.com'],
      connectSrc: ["'self'", 'https:', 'wss:', 'wss://ws-ap1.pusher.com'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:']
    }
  }
}));
app.use(cors({
  origin: ['https://via88online.com', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve uploaded files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Handle missing avatar files with proper error response and fallback
app.get('/uploads/avatars/:filename', (req, res, next) => {
  const requestedFile = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'avatars', requestedFile);
  
  console.log(`Avatar request: ${req.path}`);
  console.log(`Looking for file: ${filePath}`);
  console.log(`File exists: ${fs.existsSync(filePath)}`);
  
  if (!fs.existsSync(filePath)) {
    // Log available files for debugging
    const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
    const availableFiles = fs.existsSync(avatarsDir) ? fs.readdirSync(avatarsDir) : [];
    console.log(`Available avatar files: ${availableFiles.join(', ')}`);
    
    return res.status(404).json({
      status: 'error',
      message: 'Avatar file not found',
      requestedFile: req.path,
      availableFiles: availableFiles
    });
  }
  
  next();
});

// Test database connection on startup
testConnection();

// Run database migrations on startup
import('./database/migrate.js').then(({ default: runMigrations }) => {
  runMigrations();
});

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
    if (result.success) {
      res.json({ 
        status: 'success', 
        message: 'Database connection is working',
        data: result.data
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
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
    const token = generateToken(user);

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      authToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
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

    // Find user by username or email
    const userResult = await executeQuery(
      'SELECT id, username, email, password_hash, is_active FROM users WHERE username = ? OR email = ?',
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

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      status: 'success',
      message: 'Login successful',
      authToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
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
    // Extra guard in case middleware didn't attach user properly
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }
    const userResult = await executeQuery(
      'SELECT id, username, email, first_name, last_name, phone, avatar, bio, created_at, updated_at FROM users WHERE id = ?',
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

// Configure multer for secure file uploads
const storage = multer.diskStorage({
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

const fileFilter = (req, file, cb) => {
  // Only allow image files
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Avatar upload endpoint
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
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

      // Get current user avatar to delete old file
      const currentUserResult = await executeQuery(
        'SELECT avatar FROM users WHERE id = ?',
        [userId]
      );

      // Update user avatar in database first
      const avatarUrl = `/uploads/avatars/${processedFilename}`;
      const updateResult = await executeQuery(
        'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [avatarUrl, userId]
      );

      // Delete old avatar file if it exists (after updating database)
      if (currentUserResult.success && currentUserResult.data.length > 0) {
        const oldAvatar = currentUserResult.data[0].avatar;
        // Only delete if it's different from the new avatar and exists
        if (oldAvatar && oldAvatar !== avatarUrl && oldAvatar.startsWith('/uploads/avatars/')) {
          // Remove the leading slash for path.join
          const oldAvatarPath = path.join(__dirname, oldAvatar.substring(1));
          if (fs.existsSync(oldAvatarPath)) {
            try {
              fs.unlinkSync(oldAvatarPath);
              console.log('Old avatar file deleted:', oldAvatarPath);
            } catch (deleteError) {
              console.warn('Failed to delete old avatar file:', deleteError.message);
              // Don't fail the request if old file deletion fails
            }
          }
        }
      }

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

// Configure storage for website/template thumbnails
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dirPath = path.join(__dirname, 'uploads', 'template');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    cb(null, dirPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `template-thumb-${uniqueSuffix}.jpg`);
  }
});

const templateThumbUpload = multer({
  storage: templateStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

// Website/template thumbnail upload endpoint
// Accept both 'file' and 'thumbnail' field names for compatibility
app.post('/api/upload/website-thumbnail', authenticateToken, (req, res, next) => {
  const handlerWithFile = templateThumbUpload.single('file');
  const handlerWithThumbnail = templateThumbUpload.single('thumbnail');
  // Try parsing as 'file' first; if no file parsed, try 'thumbnail'
  handlerWithFile(req, res, function () {
    if (!req.file) {
      handlerWithThumbnail(req, res, function () {
        next();
      });
    } else {
      next();
    }
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided'
      });
    }

    const inputPath = req.file.path;
    const outputFilename = req.file.filename.replace(/\.jpg$/i, '.jpg');
    const outputPath = path.join(path.dirname(inputPath), outputFilename);

    // Resize to a reasonable thumbnail size and convert to JPEG
    await sharp(inputPath)
      .resize(600, 400, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Remove original temp file if different
    if (inputPath !== outputPath && fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    const publicUrl = `/uploads/template/${path.basename(outputPath)}`;
    return res.status(201).json({
      status: 'success',
      message: 'Thumbnail uploaded successfully',
      url: publicUrl,
      filePath: publicUrl
    });
  } catch (error) {
    console.error('Website thumbnail upload error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process thumbnail'
    });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug endpoint to check avatar files
app.get('/api/debug/avatar/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user's avatar from database
    const userResult = await executeQuery(
      'SELECT id, username, avatar FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const user = userResult.data[0];
    const avatarPath = user.avatar;
    const filePath = path.join(__dirname, avatarPath);
    const fileExists = fs.existsSync(filePath);
    
    // Get all available avatar files
    const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
    const availableFiles = fs.existsSync(avatarsDir) ? fs.readdirSync(avatarsDir) : [];
    
    res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      fileInfo: {
        path: filePath,
        exists: fileExists,
        availableFiles: availableFiles
      }
    });
    
  } catch (error) {
    console.error('Debug avatar error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get site settings (public settings only)
app.get('/api/settings', async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT setting_key, setting_value, setting_type FROM site_settings WHERE is_public = 1'
    );
    
    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch site settings'
      });
    }
    
    // Convert settings to object format
    const settings = {};
    result.data.forEach(setting => {
      let value = setting.setting_value;
      
      // Parse value based on type
      switch (setting.setting_type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseInt(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            // Keep original value if parsing fails
          }
          break;
        default:
          // Keep original value
      }
      
      settings[setting.setting_key] = value;
    });
    
    res.json({
      status: 'success',
      settings
    });
    
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get all site settings (admin only)
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery(
      'SELECT username FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const user = userResult.data[0];
    if (user.username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const result = await executeQuery(
      'SELECT setting_key, setting_value, setting_type, description, is_public FROM site_settings ORDER BY setting_key'
    );
    
    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch site settings'
      });
    }
    
    // Convert settings to object format
    const settings = {};
    result.data.forEach(setting => {
      let value = setting.setting_value;
      
      // Parse value based on type
      switch (setting.setting_type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseInt(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            // Keep original value if parsing fails
          }
          break;
        default:
          // Keep original value
      }
      
      settings[setting.setting_key] = {
        value,
        type: setting.setting_type,
        description: setting.description,
        isPublic: setting.is_public
      };
    });
    
    res.json({
      status: 'success',
      settings
    });
    
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Update site settings (admin only)
app.put('/api/admin/settings', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery(
      'SELECT username FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const user = userResult.data[0];
    if (user.username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Settings object is required'
      });
    }
    
    // Update each setting
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      let stringValue;
      
      // Convert value to string based on type
      if (typeof value === 'boolean') {
        stringValue = value.toString();
      } else if (typeof value === 'object') {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = value.toString();
      }
      
      return executeQuery(
        'UPDATE site_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [stringValue, key]
      );
    });
    
    const results = await Promise.all(updatePromises);
    
    // Check if all updates were successful
    const failedUpdates = results.filter(result => !result.success);
    
    if (failedUpdates.length > 0) {
      return res.status(500).json({
        status: 'error',
        message: 'Some settings failed to update',
        failedKeys: failedUpdates.map((_, index) => Object.keys(settings)[index])
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

// Get user balance (admin only)
app.get('/api/admin/users/:id/balance', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userResult.success || userResult.data.length === 0 || userResult.data[0].username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID'
      });
    }

    const result = await executeQuery(
      'SELECT id, username, email, balance FROM users WHERE id = ?',
      [id]
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user balance',
        error: result.error
      });
    }

    if (result.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = result.data[0];
    res.json({
      status: 'success',
      data: {
        user_id: user.id,
        username: user.username,
        email: user.email,
        balance: parseFloat(user.balance || 0)
      }
    });

  } catch (error) {
    console.error('Get user balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user balance',
      error: error.message
    });
  }
});

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

// ============================================================================
// USER MANAGEMENT API ENDPOINTS
// ============================================================================

// Test endpoint
app.get('/api/admin/test', (req, res) => {
  res.json({ status: 'success', message: 'User management API is working' });
});

// Export users to CSV
app.get('/api/admin/users/export', async (req, res) => {
  try {
    // Temporarily disabled authentication for testing
    // TODO: Re-enable authentication in production

    const { format = 'csv', status = 'all' } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status !== 'all') {
      if (status === 'active') {
        whereClause += ' AND is_active = 1';
      } else if (status === 'inactive') {
        whereClause += ' AND is_active = 0';
      }
    }

    const result = await executeQuery(
      `SELECT 
        id, username, email, first_name, last_name, 
        is_active, created_at, updated_at
       FROM users 
       ${whereClause} 
       ORDER BY created_at DESC`,
      params
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users for export'
      });
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'ID,Username,Email,First Name,Last Name,Status,Role,Created At,Updated At\n';
      const csvData = result.data.map(user => 
        `${user.id},"${user.username}","${user.email}","${user.first_name || ''}","${user.last_name || ''}","${user.is_active ? 'active' : 'inactive'}","user","${user.created_at}","${user.updated_at}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      res.json({
        status: 'success',
        data: result.data
      });
    }

  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get all users with pagination, search, and filtering
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userResult.success || userResult.data.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const username = userResult.data[0].username;
    // Allow vohuunhan and admintest as admins for now
    if (username !== 'vohuunhan' && username !== 'admintest') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'all',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    let params = [];

    // Add search filter
    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add status filter
    if (status !== 'all') {
      if (status === 'active') {
        whereClause += ' AND is_active = 1';
      } else if (status === 'inactive') {
        whereClause += ' AND is_active = 0';
      }
    }

    // Get total count
    const countResult = await executeQuery(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    if (!countResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user count'
      });
    }

    const total = countResult.data[0].total;

    // Get users with pagination
    const usersResult = await executeQuery(
      `SELECT 
        id, username, email, first_name, last_name, 
        is_active, avatar, created_at, updated_at
       FROM users 
       ${whereClause} 
       ORDER BY ${sortBy} ${sortOrder} 
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    if (!usersResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users'
      });
    }

    // Map is_active to status for frontend compatibility
    const users = usersResult.data.map(user => ({
      ...user,
      status: user.is_active ? 'active' : 'inactive',
      role: 'user' // Default role since we don't have role column
    }));

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get single user by ID
app.get('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userResult.success || userResult.data.length === 0 || userResult.data[0].username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;
    const result = await executeQuery(
      'SELECT id, username, email, first_name, last_name, is_active, avatar, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user'
      });
    }

    if (result.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Map is_active to status for frontend compatibility
    const user = {
      ...result.data[0],
      status: result.data[0].is_active ? 'active' : 'inactive',
      role: 'user' // Default role since we don't have role column
    };

    res.json({
      status: 'success',
      data: user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Create new user
app.post('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userResult.success || userResult.data.length === 0 || userResult.data[0].username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { username, email, password, first_name, last_name, status = 'active' } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username, email, and password are required'
      });
    }

    // Check if username or email already exists
    const existingUser = await executeQuery(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.success && existingUser.data.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await executeQuery(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [username, email, hashedPassword, first_name || '', last_name || '', status === 'active' ? 1 : 0]
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create user'
      });
    }

    // Get the created user
    const newUserResult = await executeQuery(
      'SELECT id, username, email, first_name, last_name, is_active, avatar, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // Map is_active to status for frontend compatibility
    const user = {
      ...newUserResult.data[0],
      status: newUserResult.data[0].is_active ? 'active' : 'inactive'
    };

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: user
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Update user
app.put('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userResult.success || userResult.data.length === 0 || userResult.data[0].username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;
    const { username, email, first_name, last_name, role, status, password } = req.body;

    // Check if user exists
    const existingUser = await executeQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser.success || existingUser.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const duplicateCheck = await executeQuery(
        'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
        [username, email, id]
      );

      if (duplicateCheck.success && duplicateCheck.data.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Username or email already exists'
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(last_name);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const result = await executeQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update user'
      });
    }

    // Get updated user
    const updatedUserResult = await executeQuery(
      'SELECT id, username, email, first_name, last_name, is_active, avatar, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    // Map is_active to status for frontend compatibility
    const user = {
      ...updatedUserResult.data[0],
      status: updatedUserResult.data[0].is_active ? 'active' : 'inactive',
      role: 'user' // Default role since we don't have role column
    };

    res.json({
      status: 'success',
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userResult.success || userResult.data.length === 0 || userResult.data[0].username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const existingUser = await executeQuery('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser.success || existingUser.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Delete user
    const result = await executeQuery('DELETE FROM users WHERE id = ?', [id]);

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete user'
      });
    }

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Bulk operations on users
app.post('/api/admin/users/bulk', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await executeQuery('SELECT username FROM users WHERE id = ?', [req.user.id]);
    if (!userResult.success || userResult.data.length === 0 || userResult.data[0].username !== 'vohuunhan') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Action and user IDs are required'
      });
    }

    // Prevent admin from performing bulk operations on themselves
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot perform bulk operations on your own account'
      });
    }

    let result;
    const placeholders = userIds.map(() => '?').join(',');

    switch (action) {
      case 'delete':
        result = await executeQuery(`DELETE FROM users WHERE id IN (${placeholders})`, userIds);
        break;
      case 'activate':
        result = await executeQuery(`UPDATE users SET status = 'active', updated_at = NOW() WHERE id IN (${placeholders})`, userIds);
        break;
      case 'deactivate':
        result = await executeQuery(`UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id IN (${placeholders})`, userIds);
        break;
      case 'suspend':
        result = await executeQuery(`UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id IN (${placeholders})`, userIds);
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid action'
        });
    }

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to perform bulk operation'
      });
    }

    res.json({
      status: 'success',
      message: `Bulk ${action} completed successfully`,
      affectedRows: result.affectedRows
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});


// Analytics endpoints
app.post('/api/analytics/track-page-view', async (req, res) => {
  try {
    const { page, duration = 0 } = req.body;
    
    // Get user ID from token if available, otherwise track as anonymous
    let userId = null;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = verifyToken(token);
        userId = decoded.id;
      } catch {
        // Token invalid, continue as anonymous
        console.log('Invalid token for analytics, tracking as anonymous');
      }
    }

    if (!page) {
      return res.status(400).json({
        status: 'error',
        message: 'Page parameter is required'
      });
    }

    // Insert page view record (user_id can be null for anonymous tracking)
    const result = await executeQuery(
      'INSERT INTO page_views (user_id, page, duration, created_at) VALUES (?, ?, ?, NOW())',
      [userId, page, duration]
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to track page view'
      });
    }

    res.json({
      status: 'success',
      message: 'Page view tracked successfully'
    });

  } catch (error) {
    console.error('Track page view error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Dashboard analytics endpoint
app.get('/api/dashboard/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get basic analytics data
    const [userCount, pageViews, recentActivity] = await Promise.all([
      executeQuery('SELECT COUNT(*) as total FROM users WHERE is_active = 1'),
      executeQuery('SELECT COUNT(*) as total FROM page_views WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)', [userId]),
      executeQuery('SELECT page, COUNT(*) as views FROM page_views WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY page ORDER BY views DESC LIMIT 5', [userId])
    ]);

    const analytics = {
      totalUsers: userCount.success ? userCount.data[0].total : 0,
      monthlyPageViews: pageViews.success ? pageViews.data[0].total : 0,
      topPages: recentActivity.success ? recentActivity.data : [],
      lastUpdated: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: analytics
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});



// Domains API endpoints - REMOVED: Using complete APIs from server.js instead
// Phishing API endpoints - REMOVED: Using complete APIs from server.js instead

// Tools API endpoint
app.get('/api/tools', authenticateToken, async (req, res) => {
  try {
    const result = await executeQuery(
      'SELECT id, name, description, category, status, created_at FROM tools WHERE is_active = 1 ORDER BY category, name'
    );

    if (!result.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tools'
      });
    }

    res.json({
      status: 'success',
      data: result.data
    });

  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// User analytics summary endpoint
app.get('/api/analytics/user-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user analytics summary
    const [pageViewsResult, domainsResult, templatesResult, websitesResult] = await Promise.all([
      executeQuery('SELECT COUNT(*) as total FROM page_views WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)', [userId]),
      executeQuery('SELECT COUNT(*) as total FROM domains WHERE user_id = ?', [userId]),
      executeQuery('SELECT COUNT(*) as total FROM templates WHERE user_id = ?', [userId]),
      executeQuery('SELECT COUNT(*) as total FROM phishing_websites WHERE user_id = ?', [userId])
    ]);

    const summary = {
      pageViews: pageViewsResult.success ? pageViewsResult.data[0].total : 0,
      domains: domainsResult.success ? domainsResult.data[0].total : 0,
      templates: templatesResult.success ? templatesResult.data[0].total : 0,
      websites: websitesResult.success ? websitesResult.data[0].total : 0,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: summary
    });

  } catch (error) {
    console.error('User analytics summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get user balance endpoint
app.get('/api/user/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user balance from users table
    const userResult = await executeQuery(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const balance = parseFloat(userResult.data[0].balance || 0);

    res.json({
      status: 'success',
      data: {
        balance: balance
      }
    });

  } catch (error) {
    console.error('Get user balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get user total balance endpoint
app.get('/api/user/total-balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total balance from user_analytics table
    const analyticsResult = await executeQuery(
      'SELECT total_balance FROM user_analytics WHERE user_id = ?',
      [userId]
    );

    let totalBalance = 0;
    if (analyticsResult.success && analyticsResult.data.length > 0) {
      totalBalance = parseFloat(analyticsResult.data[0].total_balance || 0);
    }

    res.json({
      status: 'success',
      data: {
        total_balance: totalBalance
      }
    });

  } catch (error) {
    console.error('Get user total balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get user tools used count endpoint
app.get('/api/user/tools-used', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get tool use count from user_analytics table
    const analyticsResult = await executeQuery(
      'SELECT tool_use_count FROM user_analytics WHERE user_id = ?',
      [userId]
    );

    let toolsUsed = 0;
    if (analyticsResult.success && analyticsResult.data.length > 0) {
      toolsUsed = parseInt(analyticsResult.data[0].tool_use_count || 0);
    }

    res.json({
      status: 'success',
      data: {
        tools_used: toolsUsed
      }
    });

  } catch (error) {
    console.error('Get user tools used error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get user points endpoint
app.get('/api/user/points', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get points from users table
    const userResult = await executeQuery(
      'SELECT points FROM users WHERE id = ?',
      [userId]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const points = parseInt(userResult.data[0].points || 0);

    res.json({
      status: 'success',
      data: {
        points: points
      }
    });

  } catch (error) {
    console.error('Get user points error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Templates API endpoints - REMOVED: Using complete APIs from server.js instead
// Phishing API endpoints - REMOVED: Using complete APIs from server.js instead  
// Domains API endpoints - REMOVED: Using complete APIs from server.js instead

// Add new API routes
app.use('/api/templates', templateFieldsRouter);
app.use('/api/capture', captureRouter);

// Serve React app for any non-API routes
app.use((req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).json({
      status: 'error',
      message: 'API endpoint not found'
    });
  }
});

// Error handler
app.use((error, req, res) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    status: 'error', 
    message: 'Internal server error' 
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Database test: http://localhost:${PORT}/api/db-test`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`📝 To access from domain, configure reverse proxy or deploy to domain`);
  
  // Initialize WebSocket server
  websocketManager.initialize(server);
});

export default app;
