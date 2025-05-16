import axios from 'axios';
import DeviceInfo from 'react-native-device-info';
import * as RootNavigation from './RootNavigation';

const $axios = axios.create();
$axios.defaults.timeout = 120000;
$axios.interceptors.request.use(
  config => {
    let profile = null;
    let url = 'http://192.168.2.199:8001';
    let deviceProfile = `Android App: ${DeviceInfo.getBrand()}, ${DeviceInfo.getModel()}`;
    config.baseURL = url;
    if (profile) {
      config.headers = {
        'Content-Type': 'application/json',
        'User-Type': deviceProfile,
      };
    } else {
      config.headers = {
        'Content-Type': 'application/json',
        token: `OY0TC9T7iyCbHGtixotgyXzDbXR4cnMP`,
        'User-Type': deviceProfile,
      };
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// $axios.interceptors.response.use(
//   response => {
//     let res = response.data;
//     if (res && res.status_code && res.status_code == '401') {
//       RootNavigation.navigateReplace('LoginView');
//       return Promise.resolve(response);
//     }
//     return Promise.resolve(response);
//   },
//   function (error) {
//     console.log(error);
//     return Promise.reject(error);
//   },
// );

export default $axios;
