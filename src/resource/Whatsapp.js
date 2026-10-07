import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

const whatsappUrl = '/api/v1/helper/whatsapp';
const sessionUrl = '/api/v1/helper/whatsapp-session';

// Status koneksi WhatsApp (session per tenant — backend resolve dari tenant aktif)
export const fetchWhatsAppStatus = async (useAlert = false) => {
  return new Promise(resolve => {
    $axios
      .get(`${whatsappUrl}/status`)
      .then(result => {
        const data = result.data;
        if (data.error) {
          if (useAlert) {
            Toast.show({type: 'error', text1: 'Error', text2: data.message});
          }
          return resolve(false);
        }
        return resolve(data.data?.[0] || null);
      })
      .catch(e => {
        if (useAlert) {
          Toast.show({type: 'error', text1: 'Error', text2: e.message});
        }
        return resolve(false);
      });
  });
};

// Ambil QR WhatsApp untuk pairing (null jika sudah login)
export const fetchWhatsAppQR = async (useAlert = false) => {
  return new Promise(resolve => {
    $axios
      .get(`${whatsappUrl}/qr`)
      .then(result => {
        const data = result.data;
        if (data.error) {
          if (useAlert) {
            Toast.show({type: 'error', text1: 'Error', text2: data.message});
          }
          return resolve(false);
        }
        return resolve(data.data?.[0] || null);
      })
      .catch(e => {
        if (useAlert) {
          Toast.show({type: 'error', text1: 'Error', text2: e.message});
        }
        return resolve(false);
      });
  });
};

// Simpan session baru via PUT
export const createWhatsAppSession = async (params = {}) => {
  return new Promise(resolve => {
    $axios
      .put(sessionUrl, params)
      .then(result => {
        const data = result.data;
        if (data.error) {
          Toast.show({type: 'error', text1: 'Error', text2: data.message});
          return resolve(false);
        }
        return resolve(data.data?.[0] || null);
      })
      .catch(e => {
        Toast.show({type: 'error', text1: 'Error', text2: e.message});
        return resolve(false);
      });
  });
};

// Hapus session WhatsApp (disconnect).
// Kirim DELETE ke /whatsapp/session (body: {id:'main'}).
export const deleteWhatsAppSession = async (params = {}) => {
  return new Promise(resolve => {
    $axios
      .delete(`${whatsappUrl}/session`, {data: params})
      .then(result => {
        const data = result.data;
        if (data.error) {
          Toast.show({type: 'error', text1: 'Error', text2: data.message});
          return resolve(false);
        }
        return resolve(true);
      })
      .catch(e => {
        Toast.show({type: 'error', text1: 'Error', text2: e.message});
        return resolve(false);
      });
  });
};
