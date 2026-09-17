import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
import {normalizePhone} from '../helper/phone';
let url = `/api/v1/master/customer`;

// List customer dari mst_customer (search = LIKE name/phone/address)
export const getListCustomer = async (property = {}, useAlert = true) => {
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

// Tambah customer baru (mst_customer) — wajib name & phone.
// Resolve data customer yang baru dibuat (berisi id) agar bisa dipakai
// sebagai customer_id saat menyimpan item.
export const createCustomer = async (Params = {}) => {
  const payload = {
    ...Params,
    phone: normalizePhone(Params.phone),
    ...(Params.phone_alt
      ? {phone_alt: normalizePhone(Params.phone_alt)}
      : {}),
  };
  return new Promise(resolve => {
    $axios
      .put(url, payload)
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
          text2: 'Customer berhasil disimpan',
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

// Update customer (mst_customer) — wajib id. Phone dinormalisasi +62 di backend.
export const updateCustomer = async (Params = {}) => {
  const payload = {
    ...Params,
    ...(Params.phone ? {phone: normalizePhone(Params.phone)} : {}),
    ...(Params.phone_alt
      ? {phone_alt: normalizePhone(Params.phone_alt)}
      : {}),
  };
  return new Promise(resolve => {
    $axios
      .post(url, payload)
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
          text2: 'Customer berhasil diupdate',
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

// Sinkronisasi massal kontak ke mst_customer (bulk upsert by phone)
export const syncCustomer = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .put(`${url}/sync`, Params)
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