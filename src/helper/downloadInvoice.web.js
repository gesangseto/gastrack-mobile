import Toast from 'react-native-toast-message';
import {getInvoiceDownloadUrl} from '../resource/Payment';

// Download invoice PDF (web/PWA).
// Backend mengirim Content-Disposition: attachment, jadi navigasi ke URL
// langsung memicu unduhan tanpa meninggalkan halaman aplikasi.
export const downloadInvoicePdf = async (customerId, sessionId) => {
  try {
    const url = getInvoiceDownloadUrl(customerId, sessionId);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    Toast.show({
      type: 'success',
      text1: 'Invoice',
      text2: 'Invoice sedang diunduh',
    });
    return true;
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: 'Gagal',
      text2: e.message || 'Gagal mengunduh invoice',
    });
    return false;
  }
};
