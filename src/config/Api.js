import axios from 'axios';
import moment from 'moment';
import DeviceInfo from 'react-native-device-info';
import * as RootNavigation from './RootNavigation';
import {encryptData} from '../helper/helper';
import {getProfile, removeProfile} from '../storage';
import Toast from 'react-native-toast-message';

const generateToken = () => {
  let profile = getProfile();
  let token = null;
  if (profile) {
    token = {phone: profile.phone, expired: moment().add(60, 'minutes')};
    token = encryptData(token);
  } else {
    token = 'OY0TC9T7iyCbHGtixotgyXzDbXR4cnMP';
  }
  return token;
};

const $axios = axios.create();
$axios.defaults.timeout = 60000;
$axios.interceptors.request.use(
  config => {
    let url = 'http://192.168.0.233:8001';
    let deviceProfile = `Android App: ${DeviceInfo.getBrand()}, ${DeviceInfo.getModel()}`;
    config.baseURL = url;
    config.headers = {
      'Content-Type': 'application/json',
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
