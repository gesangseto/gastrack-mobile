import Toast from 'react-native-toast-message';
import $axios from '../config/Api';
// import {Toaster} from '../utils';

let url = `/api/v1/authentication/login`;

export const loginSeller = async (Params = {}) => {
  if (Object.keys(Params).length == 0) {
    // Toaster(error.need_param);
    return false;
  }
  // Backend login memakai username+password (tabel mst_user)
  Params = {username: Params.username, password: Params.password};

  return new Promise(resolve => {
    $axios
      .post(url, Params)
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
          let user = _data.data[0];
          Toast.show({
            type: 'success',
            text1: 'Berhasil Login',
            text2: `Selamat datang ${user.full_name}`,
          });
          return resolve(user);
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
