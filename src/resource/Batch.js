import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
// import {Toaster} from '../utils';
let url = `/api/v1/jastip/outbound-manifest`;

// Bangun query string: array → key berulang (status=Shipping&status=Draft),
// agar Express mem-parsing menjadi array dan backend memakai IN (...)
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

export const getListBatch = async (property = {}, useAlert = true) => {
  var defaultParam = {status: [], ...property};
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

// Ambil list batch dari endpoint item-batch (GET only) — dipakai tab Batch.
// Mendukung filter status (array): status=Draft&status=Shipping.
export const getListItemBatch = async (property = {}, useAlert = true) => {
  var defaultParam = {status: [], ...property};
  var query_string = buildQueryString(defaultParam);
  return new Promise(resolve => {
    $axios
      .get(`/api/v1/jastip/item-batch?${query_string}`)
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

export const getListUnfinishBatch = async (property = {}, useAlert = true) => {
  let thisUrl = url;
  var defaultParam = {status: ['Draft', 'Shipping'], ...property};
  var query_string = buildQueryString(defaultParam);
  return new Promise(resolve => {
    $axios
      .get(`${thisUrl}?${query_string}`)
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

export const createBatch = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .put(url, Params)
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

// Update batch (tambah/kurangi item sebelum dikirim).
// Backend: detach semua item lama (status→200), attach item baru (status→201).
export const updateBatch = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .post(url, Params)
      .then(result => {
        let data = result.data;
        Toast.show({
          type: data.error ? 'error' : 'success',
          text1: data.error ? 'Error' : 'Success',
          text2: data.error ? data.message : 'Batch berhasil diupdate',
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

export const shippingBatch = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .post(url + '/shipment', Params)
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
export const cancelBatch = async (Params = {}) => {
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
