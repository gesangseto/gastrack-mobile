/**
 * Polyfill WEB untuk Alert.alert.
 *
 * react-native-web mengimplementasikan Alert sebagai no-op kosong
 * (`static alert() {}`), sehingga SEMUA Alert.alert di aplikasi (26 tempat)
 * tidak melakukan apa-apa di browser. Akibatnya dialog konfirmasi seperti
 * "Yakin ingin logout?" tidak pernah muncul dan aksinya tidak pernah jalan.
 *
 * File ini dipanggil paling awal (dari index.web.js) dan mengganti Alert.alert
 * dengan implementasi berbasis window.confirm/alert bawaan browser, sehingga
 * seluruh pemanggil Alert.alert di aplikasi tetap bekerja TANPA mengubah kode
 * Android sama sekali.
 */

const installAlertPolyfill = () => {
  if (typeof window === 'undefined') return;

  // Ambil modul react-native-web yang sudah dibundel agar objek Alert-nya sama.
  let RN;
  try {
    RN = require('react-native');
  } catch (error) {
    return;
  }

  if (!RN || !RN.Alert) return;

  const formatMessage = (title, message) => {
    const parts = [];
    if (title) parts.push(String(title));
    if (message) parts.push(String(message));
    return parts.join('\n\n');
  };

  RN.Alert.alert = (title, message, buttons, options) => {
    const list =
      Array.isArray(buttons) && buttons.length > 0
        ? buttons
        : [{text: 'OK'}];

    // Satu tombol → cukup alert biasa, langsung jalankan aksinya.
    if (list.length === 1) {
      try {
        window.alert(formatMessage(title, message));
      } catch (error) {
        /* diabaikan */
      }
      if (typeof list[0].onPress === 'function') list[0].onPress();
      return;
    }

    // Banyak tombol → pakai confirm untuk tombol "aksi" (bukan cancel).
    // Tombol cancel biasanya punya style 'cancel' atau berada di awal.
    const cancelIndex = list.findIndex(b => b && b.style === 'cancel');
    const actionIndex = list.findIndex(
      (b, i) => b && b.style !== 'cancel' && i !== cancelIndex,
    );
    const action = list[actionIndex >= 0 ? actionIndex : list.length - 1];
    const cancel = cancelIndex >= 0 ? list[cancelIndex] : list[0];

    let confirmed = false;
    try {
      const confirmText = action && action.text ? action.text : 'OK';
      confirmed = window.confirm(
        `${formatMessage(title, message)}\n\nKlik OK untuk "${confirmText}".`,
      );
    } catch (error) {
      confirmed = false;
    }

    if (confirmed) {
      if (action && typeof action.onPress === 'function') action.onPress();
    } else if (cancel && typeof cancel.onPress === 'function') {
      cancel.onPress();
    }
  };
};

export default installAlertPolyfill;
