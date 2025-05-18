import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
// import {Toaster} from '../utils';
let url = `/api/v1/warehouse-tracking/transaction/inbound`;

export const getListBatch = async (property = {}, useAlert = true) => {
  var defaultParam = {status: [], ...property};
  if (defaultParam.status.length > 0) {
    defaultParam.status = JSON.stringify(defaultParam.status);
  }

  var query_string = new URLSearchParams(defaultParam).toString();
  console.log(query_string);
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

export const shippingBatch = async (Params = {}) => {
  return new Promise(resolve => {
    $axios
      .post(url + '/shipping', Params)
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
