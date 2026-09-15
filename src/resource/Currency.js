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

// Ambil rate kurs dari API publik (open.er-api.com, gratis tanpa key).
// Resolve number: 1 unit mata uang `code` = X IDR. null jika gagal.
export const fetchExchangeRate = async (code, useAlert = false) => {
  if (!code) {
    return null;
  }
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${code}`);
    const json = await res.json();
    if (json && json.result === 'success' && json.rates && json.rates.IDR) {
      return Number(json.rates.IDR);
    }
    return null;
  } catch (e) {
    if (useAlert) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Gagal ambil kurs: ${e?.message || e}`,
      });
    }
    return null;
  }
};
