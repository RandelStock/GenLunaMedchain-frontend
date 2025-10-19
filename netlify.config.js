// netlify.config.js
module.exports = {
  // Force npm instead of yarn
  npmClient: 'npm',
  
  // Build settings
  build: {
    // Skip TypeScript errors
    command: 'npm install && npm run build',
    publish: 'dist',
    environment: {
      NODE_VERSION: '18',
      NETLIFY_USE_YARN: 'false'
    }
  }
};