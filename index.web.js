/**
 * Entry point khusus WEB (PWA).
 * Metro memilih file ini untuk platform web, sehingga `index.js` (native
 * Android/iOS) tidak perlu diubah sama sekali.
 *
 * registerRootComponent diperlukan Expo untuk me-mount aplikasi ke <div id="root">
 * di browser (memanggil AppRegistry.runApplication).
 */
import registerRootComponent from 'expo/src/launch/registerRootComponent';
import App from './App';

registerRootComponent(App);
