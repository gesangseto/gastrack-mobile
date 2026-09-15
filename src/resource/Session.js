import Toast from 'react-native-toast-message';
import $axios from '../config/Api';

let url = '/api/v1/jastip/session';

// List session jastip (filter: status=Active / status=Closed)
export const getSessionList = async (property = {}, useAlert = true) => {
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
          {Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message,
          });}
        return resolve(false);
      });
  });
};

// Buka session jastip baru (start_session_date = sekarang)
export const createSession = async (Params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .put(url, Params)
      .then(result => {
        let data = result.data;
        if (data.error) {
          if (useAlert)
            {Toast.show({
              type: 'error',
              text1: 'Error',
              text2: data.message,
            });}
          return resolve(false);
        }
        if (useAlert)
          {Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Session jastip dibuka',
          });}
        return resolve(true);
      })
      .catch(e => {
        if (useAlert)
          {Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message,
          });}
        return resolve(false);
      });
  });
};

// Tutup session jastip (validasi: semua item sudah batch & batch sudah Shipping)
export const closeSession = async (id, Params = {}, useAlert = true) => {
  return new Promise(resolve => {
    $axios
      .post(url, {id, ...Params})
      .then(result => {
        let data = result.data;
        if (data.error) {
          if (useAlert)
            {Toast.show({
              type: 'error',
              text1: 'Error',
              text2: data.message,
            });}
          return resolve(false);
        }
        if (useAlert)
          {Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Session jastip ditutup',
          });}
        return resolve(true);
      })
      .catch(e => {
        if (useAlert)
          {Toast.show({
            type: 'error',
            text1: 'Error',
            text2: e.message,
          });}
        return resolve(false);
      });
  });
};
