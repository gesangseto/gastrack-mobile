const CryptoJS = require('crypto-js');
const secretKey = 'Initial-G';
import ThermalPrinterModule from 'react-native-thermal-printer';
import Toast from 'react-native-toast-message';

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

// Fungsi untuk mendekripsi data
export const printBarcode = async item => {
  ThermalPrinterModule.defaultConfig = {
    ...ThermalPrinterModule.defaultConfig,
    timeout: 30000,
    printerWidthMM: 58,
    printerNbrCharactersPerLine: 32,
  };
  try {
    // Siapkan payload print dengan path local file
    const payload =
      `[C]<barcode type='128' height='10'>${
        item?.barcode || item?.batch_no
      }</barcode>\n` + `[L]${item?.customer_name || item?.seller_name}`;
    await ThermalPrinterModule.printBluetooth({payload: payload});
    Toast.show({
      type: 'success',
      text1: 'Print Success',
    });
    return true;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: `Print failed: ${err.message}`,
    });
    return false;
  }
};
