#!/usr/bin/env node

/**
 * Startup script for Phishing Viewer Server
 * This script starts the phishing page viewer on a separate port
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startPhishingViewer = () => {
  console.log('🚀 Starting Phishing Viewer Server...');
  
  const phishingViewer = spawn('node', ['phishing-viewer.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {
      ...process.env,
      PHISHING_VIEWER_PORT: process.env.PHISHING_VIEWER_PORT || '3002'
    }
  });

  phishingViewer.on('error', (error) => {
    console.error('❌ Failed to start phishing viewer:', error);
  });

  phishingViewer.on('close', (code) => {
    console.log(`📊 Phishing viewer process exited with code ${code}`);
    if (code !== 0) {
      console.log('🔄 Restarting phishing viewer in 5 seconds...');
      setTimeout(startPhishingViewer, 5000);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down phishing viewer...');
    phishingViewer.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('🛑 Shutting down phishing viewer...');
    phishingViewer.kill('SIGINT');
  });
};

startPhishingViewer();
