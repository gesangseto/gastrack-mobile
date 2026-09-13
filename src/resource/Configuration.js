import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

let url = `/api/v1/configuration/application`;

// Ambil konfigurasi aplikasi (sys_configuration_mst) tanpa logo.
// Resolve object konfigurasi (country, country_code, dll).
export const fetchSysConfig = async (useAlert = false) => {
  return new Promise(resolve => {
    $axios
      .get(`${url}?without_logo=1`)
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

// Update konfigurasi aplikasi (sys_configuration_mst) — POST parsial.
// Wajib menyertakan users_name; field lain opsional.
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