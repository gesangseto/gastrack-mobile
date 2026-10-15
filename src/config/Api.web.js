import axios from 'axios';
import * as RootNavigation from './RootNavigation';
import {getEndpoint, getProfile, removeProfile} from '../storage';
import Toast from 'react-native-toast-message';

// Versi WEB dari Api.js.
// react-native-device-info tidak tersedia di browser → User-Type diisi info browser.
// PENTING: backend hanya mengenali user_type 'android app' | 'website app' | 'station'.
// Jika tidak cocok, request dianggap "static user" dan ditolak (401 no permission).
const getDeviceProfile = () => {
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const platform =
      typeof navigator !== 'undefined' && navigator.platform
        ? navigator.platform
        : 'Web';
    return `Website App: ${platform} (${ua})`;
  } catch (error) {
    return 'Website App';
  }
};

const generateToken = () => {
  let profile = getProfile();
  // Token berasal dari respons login Backend (sys_authentication).
  // Tanpa token → string kosong (request akan ditolak backend dengan 401).
  return profile?.token || 'ax771p65T5CykAeTWXD4Js0pLr2lyDSz';
};

const $axios = axios.create();
$axios.defaults.timeout = 60000;
$axios.interceptors.request.use(
  config => {
    let url = getEndpoint();
    let deviceProfile = getDeviceProfile();
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
    if (res && String(res.status_code) === '401') {
      Toast.show({
        type: 'error',
        text1: '401',
        text2: res.message,
      });
      // Token invalid/expired → logout & kembali ke halaman login
      removeProfile();
      RootNavigation.navigateReplace('LoginView');
      const error = new Error(res.message || 'Unauthorized');
      error.response = response;
      return Promise.reject(error);
    }
    return Promise.resolve(response);
  },
  function (error) {
    console.log(error);
    return Promise.reject(error);
  },
);

export default $axios;
