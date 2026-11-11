import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

const url = '/api/v1/notification/report';

// Daftar nomor yang ditahan cold-contact guard (channel default).
// Query: search, channel_code, reason, page, limit
export const getListNotificationReport = async (property = {}, useAlert = true) => {
  const query_string = new URLSearchParams(property).toString();
  return new Promise(resolve => {
    $axios
      .get(`${url}?${query_string}`)
      .then(result => {
        const data = result.data;
        if (data.error) {
          if (useAlert) {
            Toast.show({type: 'error', text1: 'Error', text2: data.message});
          }
          return resolve(false);
        }
        return resolve({rows: data.data || [], total: data.grand_total || 0});
      })
      .catch(e => {
        if (useAlert) {
          Toast.show({type: 'error', text1: 'Error', text2: e.message});
        }
        return resolve(false);
      });
  });
};

// Kirim ulang pesan yang dulu ditahan. Backend mengecek ulang inbound:
// kalau customer masih cold contact, pesan tidak dikirim.
export const retryNotificationReport = async id => {
  return new Promise(resolve => {
    $axios
      .post(`${url}/retry`, {id})
      .then(result => resolve(result.data))
      .catch(e =>
        resolve({error: true, message: `Gagal menghubungi server: ${e.message}`}),
      );
  });
};

// Hapus (soft delete) baris laporan.
export const deleteNotificationReport = async id => {
  return new Promise(resolve => {
    $axios
      .delete(url, {data: {id}})
      .then(result => resolve(result.data))
      .catch(e =>
        resolve({error: true, message: `Gagal menghubungi server: ${e.message}`}),
      );
  });
};
