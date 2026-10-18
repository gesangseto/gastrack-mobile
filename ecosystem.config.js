/**
 * PM2 — PWA / Web development (Expo Web + Metro).
 *
 * Catatan penting:
 *  - `script` HARUS berupa file .js (bukan biner node) — sama seperti
 *    dev-frontend. `node_modules/expo/bin/cli` adalah skrip JS ber-shebang,
 *    jadi aman dipakai PM2.
 *  - Interpreter dipaksa Node v22 (ABI 127) agar modul native tidak mismatch.
 *  - Node v22 dipakai lewat nvm; binary-nya sudah punya cap_net_bind_service
 *    sehingga port < 1024 tetap bisa dipakai tanpa root.
 *  - Port dev PWA = 8082 (lihat README.md root).
 */
module.exports = {
  apps: [
    {
      name: 'dev-pwa',
      script: 'node_modules/expo/bin/cli',
      args: 'start --web --port 8082',
      cwd: '/home/gesang/project/jastip/Android',
      interpreter: '/home/gesang/.nvm/versions/node/v22.23.3/bin/node',
      env: {
        NODE_ENV: 'development',
        // Jangan pakai CI=1: itu mematikan hot-reload Metro.
        EXPO_NO_TELEMETRY: '1',
      },
      ignore_watch: ['node_modules', '.git', '*.log', 'dist'],
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
