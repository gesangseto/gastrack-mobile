import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

let url = `/api/v1/master/country`;

// Ambil daftar negara (mst_country) yang aktif.
// Resolve array: [{id, name, code, country_code, currency_code, currency_symbol}]
export const fetchCountries = async (property = {}, useAlert = false) => {
  var query_string = new URLSearchParams(property).toString();
  return new Promise(resolve => {
    $axios
      .get(`${url}?${query_string}`)
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

// List negara dari mst_country (search = LIKE name/code/currency)
export const getListCountry = async (property = {}, useAlert = true) => {
  var query_string = new URLSearchParams(property).toString();
  return new Promise(resolve => {
    $axios
      .get(`${url}?${query_string}`)
      .then(result => {
        let data = result.data;
        if (data.error && useAlert) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: data.message,
          });
          return resolve(false);
        }
        return resolve(data.data);
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

// Tambah negara baru (mst_country) — wajib name.
export const createCountry = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .put(url, Params)
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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Negara berhasil disimpan',
        });
        return resolve(data.data);
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

// Update negara (mst_country) — wajib id.
export const updateCountry = async (Params = {}) => {
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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Negara berhasil diupdate',
        });
        return resolve(data.data);
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

// Hapus negara (soft delete, delete_flag=true).
// Aturan backend: hanya negara berstatus Inactive yang bisa dihapus.
export const deleteCountry = async id => {
  return new Promise(resolve => {
    $axios
      .delete(url, {data: {id}})
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
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Negara berhasil dihapus',
        });
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
