/**
 * Copy to each VPS clone as ecosystem.config.cjs and adjust paths/ports.
 * Or rely on Deploy workflow: pm2 start dist/index.js --name <pm2_app>
 */
module.exports = {
  apps: [
    {
      name: 'purchasing-system',
      cwd: '/home/ubuntu/purchasing-system/backend',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      env: {
        NODE_ENV: 'production',
      },
    }
  ],
};
