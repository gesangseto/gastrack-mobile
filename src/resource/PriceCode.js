import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
let url = `/api/v1/master/price-code`;

// List price code dari mst_price_code (search = LIKE name/code/number)
export const getListPriceCode = async (property = {}, useAlert = true) => {
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

// Tambah price code baru (mst_price_code) — wajib name, code & number.
export const createPriceCode = async (Params = {}) => {
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
          text2: 'Price code berhasil disimpan',
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

// Update price code (mst_price_code) — wajib id.
export const updatePriceCode = async (Params = {}) => {
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
          text2: 'Price code berhasil diupdate',
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

// Hapus price code (soft delete, delete_flag=true).
// Aturan backend: hanya price code berstatus Inactive yang bisa dihapus.
export const deletePriceCode = async id => {
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
          text2: 'Price code berhasil dihapus',
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