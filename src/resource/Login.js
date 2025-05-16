import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
// import {Toaster} from '../utils';

let url = `/api/v1/warehouse-tracking/master/seller`;

export const loginSeller = async (Params = {}) => {
  if (Object.keys(Params).length == 0) {
    // Toaster(error.need_param);
    return false;
  }

  return new Promise(resolve => {
    $axios
      .post(url + '/login', Params)
      .then(result => {
        let _data = result.data;
        if (_data.error) {
          Toast.show({
            type: 'error',
            text1: 'Gagal Login',
            text2: _data.message,
          });
          return resolve(false);
        } else {
          Toast.show({
            type: 'success',
            text1: 'Berhasil Login',
            text2: `Selamat datang ${_data.data[0].name}`,
          });
          return resolve(_data.data[0]);
        }
      })
      .catch(e => {
        Toast.show({
          type: 'error',
          text1: 'Server Error',
          text2: e,
        });
        return resolve(false);
      });
  });
};
