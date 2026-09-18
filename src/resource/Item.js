import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
// import {Toaster} from '../utils';
let url = `/api/v1/jastip/item-registry`;

// Bangun query string: array → key berulang (status=200&status=201), agar
// Express mem-parsing menjadi array dan backend memakai IN (...).
const buildQueryString = params => {
  const qs = new URLSearchParams();
  Object.keys(params).forEach(key => {
    const val = params[key];
    if (Array.isArray(val)) {
      val.forEach(v => qs.append(key, v));
    } else if (val !== undefined && val !== null && val !== '') {
      qs.append(key, val);
    }
  });
  return qs.toString();
};

export const getListItem = async (property = {}, useAlert = true) => {
  var defaultParam = {status: 200, ...property};
  var query_string = buildQueryString(defaultParam);
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

// Ambil list item dari endpoint item-stock (GET only) — dipakai tab Item.
// Mendukung filter status (array), phone, dan search (nama customer / barcode).
export const getListItemStock = async (property = {}, useAlert = true) => {
  var defaultParam = {status: 200, ...property};
  var query_string = buildQueryString(defaultParam);
  return new Promise(resolve => {
    $axios
      .get(`/api/v1/jastip/item-stock?${query_string}`)
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

// Cari item berdasarkan barcode (endpoint item-stock, GET only)
export const getItemByBarcode = async (barcode, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .get(`/api/v1/jastip/item-stock?barcode=${encodeURIComponent(barcode)}`)
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

// Cari item berdasarkan nomor HP customer (toleransi format: 0812..., 62..., +62...)
export const getItemByPhone = async (phone, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .get(
        `${url}?phone=${encodeURIComponent(phone)}&status=200`,
      )
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
        return resolve(data.data || []);
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

// Ambil item yang belum dibuatkan batch (batch_id IS NULL)
export const getItemWithoutBatch = async (useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .get(`${url}?batch_id=null&status=200`)
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
        return resolve(data.data || []);
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

export const createItem = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .put(url, Params, {headers: {'Content-Type': 'multipart/form-data'}})
      .then(result => {
        let data = result.data;
        Toast.show({
          type: data.error ? 'error' : 'success',
          text1: data.error ? 'Error' : 'Success',
          text2: data.error ? data.message : 'Data has been save',
        });
        if (data.error) {
          return resolve(false);
        } else {
          return resolve(true);
        }
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

export const updateItem = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .post(url, Params, {headers: {'Content-Type': 'multipart/form-data'}})
      .then(result => {
        let data = result.data;
        Toast.show({
          type: data.error ? 'error' : 'success',
          text1: data.error ? 'Error' : 'Success',
          text2: data.error ? data.message : 'Data has been save',
        });
        if (data.error) {
          return resolve(false);
        } else {
          return resolve(true);
        }
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

export const cancelItem = async (Params = {}) => {
  Params = {data: Params};
  return new Promise(resolve => {
    $axios
      .delete(url, Params)
      .then(result => {
        let data = result.data;
        Toast.show({
          type: data.error ? 'error' : 'success',
          text1: data.error ? 'Error' : 'Success',
          text2: data.error ? data.message : 'Data has been save',
        });
        if (data.error) {
          return resolve(false);
        } else {
          return resolve(true);
        }
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
