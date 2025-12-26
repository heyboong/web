module.exports = {
  apps: [
    {
      name: 'scanvia-dashboard',
      script: 'server.js',
      cwd: '/www/wwwroot/dashboard',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 2324
      },
      error_file: '/www/wwwroot/dashboard/logs/err.log',
      out_file: '/www/wwwroot/dashboard/logs/out.log',
      log_file: '/www/wwwroot/dashboard/logs/combined.log',
      time: true
    }
  ]
};