import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { apiConfig } from '../configs/database.config.js';

// Password hashing
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT token generation
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
  };
  
  return jwt.sign(payload, apiConfig.jwtSecret, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, apiConfig.jwtSecret);
  } catch {
    throw new Error('Invalid token');
  }
};

// Password validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, message: 'password must be at least 8 characters long' };
  }
  
  if (!hasUpperCase) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!hasLowerCase) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!hasNumbers) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!hasSpecialChar) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Username validation: allow longer IDs (timestamps) used in tests
export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,40}$/;
  return usernameRegex.test(username);
};
