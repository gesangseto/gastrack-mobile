import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

let url = `/api/v1/system/tenant/self-config`;

// Ambil "Pengaturan Aplikasi" TENANT (identitas + preferensi) dari sys_tenant.
// Tenant ditentukan oleh header X-Tenant pada klien axios.
export const fetchSysConfig = async (useAlert = false) => {
  return new Promise(resolve => {
    $axios
      .get(url)
      .then(result => {
        let data = result.data;
        if (data.error) {
          if (useAlert)
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: data.message,
            });
          return resolve(false);
        }
        return resolve(data.data?.[0] || null);
      })
      .catch(e => {
        if (useAlert)
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message,
          });
        return resolve(false);
      });
  });
};

// Update "Pengaturan Aplikasi" TENANT di sys_tenant (POST parsial).
// Kirim hanya field yang berubah; identity_name wajib tidak kosong.
export const updateSysConfig = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .post(url, Params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.message,
          });
          return resolve(false);
        }
        return resolve(true);
      })
      .catch(e => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: e.message,
        });
        return resolve(false);
      });
  });
};