// Versi WEB dari helper.
// Printer thermal (Bluetooth) tidak tersedia di browser → printBarcode jadi no-op.
// Fungsi enkripsi & MIME tetap dipakai di web sehingga dipertahankan.
const CryptoJS = require('crypto-js');
const secretKey = 'Initial-G';
import Toast from 'react-native-toast-message';

const isJsonString = value => {
  if (typeof value !== 'string') return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
};

// Fungsi untuk mengenkripsi data
export const encryptData = data => {
  if (!data) return;
  if (typeof data == 'object') data = JSON.stringify(data);
  return CryptoJS.AES.encrypt(data, secretKey).toString();
};

// Fungsi untuk mendekripsi data
export const decryptData = encryptedData => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    let decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    if (isJsonString(decryptedData)) decryptedData = JSON.parse(decryptedData);
    return decryptedData; // langsung string jika string, atau object jika object
  } catch (error) {
    console.log('Decryption error:', error);
    return false;
  }
};

// Printer thermal tidak tersedia di web — beri tahu pengguna, jangan crash.
export const printBarcode = async () => {
  Toast.show({
    type: 'info',
    text1: 'Print tidak tersedia',
    text2: 'Fitur cetak barcode hanya tersedia di aplikasi Android.',
  });
  return false;
};

export const getMimeType = filename => {
  if (!filename) return null;

  const extension = filename.split('.').pop().toLowerCase();

  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    txt: 'text/plain',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return mimeTypes[extension] || 'application/octet-stream';
};
