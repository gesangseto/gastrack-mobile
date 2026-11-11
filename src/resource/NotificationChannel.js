import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

const url = '/api/v1/notification/channel';

// Daftar channel notifikasi (default / send_wia / kirimi / ...)
export const getNotificationChannels = async (property = {}, useAlert = true) => {
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
        return resolve(data.data || []);
      })
      .catch(e => {
        if (useAlert) {
          Toast.show({type: 'error', text1: 'Error', text2: e.message});
        }
        return resolve(false);
      });
  });
};

// Kesiapan channel: connected/ready + kuota harian channel default.
// Tanpa `code` = semua channel.
export const getNotificationChannelStatus = async (code = null) => {
  const query = code ? `?code=${encodeURIComponent(code)}` : '';
  return new Promise(resolve => {
    $axios
      .get(`${url}/status${query}`)
      .then(result => {
        const data = result.data;
        if (data.error) {return resolve(false);}
        return resolve(data.data || []);
      })
      .catch(() => resolve(false));
  });
};

// Update channel (POST = update pada konvensi project ini).
// Body: { id, name?, description?, api_key?, sender?, status? }
export const updateNotificationChannel = async (params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(url, params)
      .then(result => {
        const data = result.data;
        if (data.error) {
          if (useAlert) {
            Toast.show({
              type: 'error',
              text1: 'Gagal Simpan',
              text2: data.message,
            });
          }
          return resolve(false);
        }
        Toast.show({
          type: 'success',
          text1: 'Berhasil',
          text2: 'Channel notification disimpan',
        });
        return resolve(data.data?.[0] || true);
      })
      .catch(e => {
        if (useAlert) {
          Toast.show({type: 'error', text1: 'Error', text2: e.message});
        }
        return resolve(false);
      });
  });
};

// Cek satu channel tanpa mengirim pesan.
export const testNotificationChannelConnection = async code => {
  return new Promise(resolve => {
    $axios
      .get(`${url}/test-connection?code=${encodeURIComponent(code)}`)
      .then(result => resolve(result.data))
      .catch(e =>
        resolve({error: true, message: `Gagal menghubungi server: ${e.message}`}),
      );
  });
};

// Kirim pesan uji lewat channel tertentu.
export const sendTestNotificationChannel = async ({
  code,
  to,
  message,
} = {}) => {
  return new Promise(resolve => {
    $axios
      .post(`${url}/test`, {code, to, message})
      .then(result => resolve(result.data))
      .catch(e =>
        resolve({error: true, message: `Gagal menghubungi server: ${e.message}`}),
      );
  });
};
