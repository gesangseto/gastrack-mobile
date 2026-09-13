import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

let url = `/api/v1/master/currency`;

// Ambil daftar mata uang (mst_currency) yang aktif.
// Resolve array: [{id, code, name, symbol, country}]
export const fetchCurrencies = async (useAlert = false) => {
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
          return resolve([]);
        }
        return resolve(data.data || data.rows || []);
      })
      .catch(e => {
        if (useAlert)
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e?.message || e,
          });
        return resolve([]);
      });
  });
};