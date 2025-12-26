module.exports = {
  apps: [{
    name: 'phishing-viewer',
    script: 'phishing-viewer.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PHISHING_VIEWER_PORT: 3002
    },
    env_production: {
      NODE_ENV: 'production',
      PHISHING_VIEWER_PORT: 3002
    },
    log_file: './logs/phishing-viewer.log',
    out_file: './logs/phishing-viewer-out.log',
    error_file: './logs/phishing-viewer-error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
};
