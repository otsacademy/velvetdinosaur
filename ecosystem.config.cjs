const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

const cwd = __dirname;
const envPath = path.join(cwd, '.env.production');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

module.exports = {
  apps: [
    {
      name: 'vd-designer',
      cwd,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      env: {
        PORT: process.env.PORT || '3001',
        NODE_ENV: process.env.NODE_ENV || 'production'
      }
    }
  ]
};
