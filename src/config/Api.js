import axios from 'axios';
import DeviceInfo from 'react-native-device-info';
import * as RootNavigation from './RootNavigation';
import {getEndpoint, getProfile, removeProfile} from '../storage';
import Toast from 'react-native-toast-message';

const generateToken = () => {
  let profile = getProfile();
  // Token berasal dari respons login Backend (sys_authentication).
  // Tanpa token → string kosong (request akan ditolak backend dengan 401).
  return profile?.token || '';
};

const $axios = axios.create();
$axios.defaults.timeout = 60000;
$axios.interceptors.request.use(
  config => {
    let url = getEndpoint();
    let deviceProfile = `Android App: ${DeviceInfo.getBrand()}, ${DeviceInfo.getModel()}`;
    config.baseURL = url;
    config.headers = {
      ...config.headers, // ini penting agar header khusus per request tidak tertimpa
      token: generateToken(),
      'User-Type': deviceProfile,
    };

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

$axios.interceptors.response.use(
  response => {
    let res = response.data;
    if (res && res.status_code && res.status_code == '401') {
      Toast.show({
        type: 'error',
        text1: '401',
        text2: res.message,
      });
      // Token invalid/expired → logout & kembali ke halaman login
      removeProfile();
      RootNavigation.navigateReplace('LoginView');
    }
    return Promise.resolve(response);
  },
  function (error) {
    console.log(error);
    return Promise.reject(error);
  },
);

export default $axios;
