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

// ============================================================================
// OPTIMASI BUNDLE
// ============================================================================

// 1) Tree-shaking (dead code removal).
//    Menghapus kode yang tidak dipakai dari bundle produksi. Di SDK 53 fitur ini
//    masih "experimental", jadi hanya diterapkan saat build produksi.
//    Catatan: fitur ini butuh @expo/metro-config >= 0.20.16 (proyek ini 0.20.18).
//    https://docs.expo.dev/guides/tree-shaking/
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: true,
  },
});

// 2) Hapus console.log dari bundle produksi (kecilkan ukuran + hindari
//    membocorkan info internal). console.warn & console.error tetap dipertahankan
//    agar error tetap terlihat saat debugging.
//    https://docs.expo.dev/guides/minify/
config.transformer.minifierConfig = {
  ...(config.transformer.minifierConfig || {}),
  compress: {
    ...((config.transformer.minifierConfig || {}).compress || {}),
    drop_console: ['log', 'info', 'debug'],
  },
};

module.exports = config;
