#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Development Server for via88online.com');
console.log('📁 Working directory:', __dirname);

// Kill any existing processes on ports 2324 and 5173
const killPort = (port) => {
  return new Promise((resolve) => {
    const kill = spawn('fuser', ['-k', `${port}/tcp`], { stdio: 'ignore' });
    kill.on('close', () => {
      console.log(`✅ Killed processes on port ${port}`);
      resolve();
    });
  });
};

// Start the backend server
const startBackend = () => {
  return new Promise((resolve, reject) => {
    console.log('🔧 Starting backend server on port 2324...');
    const backend = spawn('node', ['server.js'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    backend.on('error', (err) => {
      console.error('❌ Backend server error:', err);
      reject(err);
    });

    backend.on('spawn', () => {
      console.log('✅ Backend server started');
      resolve(backend);
    });
  });
};

// Start the Vite dev server
const startFrontend = () => {
  return new Promise((resolve, reject) => {
    console.log('🎨 Starting Vite dev server on port 5173...');
    const frontend = spawn('npm', ['run', 'dev:client'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    frontend.on('error', (err) => {
      console.error('❌ Frontend server error:', err);
      reject(err);
    });

    frontend.on('spawn', () => {
      console.log('✅ Frontend server started');
      resolve(frontend);
    });
  });
};

// Main function
const main = async () => {
  try {
    // Kill existing processes
    await killPort(2324);
    await killPort(5173);
    
    // Wait a bit for ports to be released
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start servers
    const backend = await startBackend();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for backend to start
    const frontend = await startFrontend();
    
    console.log('\n🎉 Development servers are running!');
    console.log('🌐 Production URL: https://via88online.com');
    console.log('🔧 Development URL: https://via88online.com/dev/');
    console.log('📡 API URL: https://via88online.com/api/');
    console.log('\n💡 Press Ctrl+C to stop all servers');
    
    // Handle graceful shutdown
    const shutdown = () => {
      console.log('\n🛑 Shutting down servers...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('❌ Failed to start development servers:', error);
    process.exit(1);
  }
};

main();
