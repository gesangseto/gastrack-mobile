const {getDefaultConfig} = require('expo/metro-config');

/**
 * Metro configuration (Expo) — dipakai untuk native Android & web/PWA.
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Pertahankan port lama agar workflow Android (react-native start) tidak berubah.
config.server = {
  ...(config.server || {}),
  port: 8082,
};

module.exports = config;
