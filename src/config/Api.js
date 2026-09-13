import axios from 'axios';
import DeviceInfo from 'react-native-device-info';
import * as RootNavigation from './RootNavigation';
import {getEndpoint, getProfile, removeProfile} from '../storage';
import Toast from 'react-native-toast-message';

const generateToken = () => {
  let profile = getProfile();
  // Token berasal dari respons login Backend (sys_authentication)
  return profile?.token || 'ax771p65T5CykAeTWXD4Js0pLr2lyDSz';
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
    console.log(config);

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
      console.log(res);

      Toast.show({
        type: 'error',
        text1: '401',
        text2: res.message,
      });
      // removeProfile();
      // RootNavigation.navigateReplace('LoginView');
      // return Promise.resolve(response);
    }
    return Promise.resolve(response);
  },
  function (error) {
    console.log(error);
    return Promise.reject(error);
  },
);

export default $axios;
