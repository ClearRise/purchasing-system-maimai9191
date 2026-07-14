/**
 * Copy to each VPS clone as ecosystem.config.cjs and adjust paths/ports.
 * Or rely on Deploy workflow: pm2 start dist/index.js --name <pm2_app>
 */
module.exports = {
  apps: [
    {
      name: 'inventory-system-ochiai',
      cwd: '/home/ubuntu/inventory-system-ochiai/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'inventory-system-taiyou',
      cwd: '/home/ubuntu/inventory-system-taiyou/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'inventory-system-lne',
      cwd: '/home/ubuntu/inventory-system-lne/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
