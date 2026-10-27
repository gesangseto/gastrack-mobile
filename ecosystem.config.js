module.exports = {
  apps: [
    {
      name: 'jastipcenter-web',
      cwd: __dirname,
      script: 'node_modules/expo/bin/cli',
      args: 'start --web --host lan --port 8082',
      interpreter: 'node',
      env: {
        BROWSER: 'none',
        NODE_ENV: 'development',
      },
      // Metro provides Fast Refresh; PM2 watch would restart and interrupt it.
      watch: false,
      autorestart: true,
    },
  ],
};
