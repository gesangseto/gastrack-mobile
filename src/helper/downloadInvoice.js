import {Linking} from 'react-native';
import Toast from 'react-native-toast-message';
import {getInvoiceDownloadUrl} from '../resource/Payment';

// Download invoice PDF (Android native).
// Tidak ada modul file-system di project ini → PDF dibuka lewat browser,
// yang menangani unduhan karena backend mengirim Content-Disposition attachment.
export const downloadInvoicePdf = async (customerId, sessionId) => {
  try {
    const url = getInvoiceDownloadUrl(customerId, sessionId);
    await Linking.openURL(url);
    Toast.show({
      type: 'info',
      text1: 'Invoice',
      text2: 'Invoice dibuka di browser untuk diunduh',
    });
    return true;
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: 'Gagal',
      text2: e.message || 'Gagal membuka invoice',
    });
    return false;
  }
};
