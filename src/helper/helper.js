const CryptoJS = require('crypto-js');
const secretKey = 'Initial-G';

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
