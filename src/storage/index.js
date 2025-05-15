import {MMKV} from 'react-native-mmkv';
export const storage = new MMKV(); // Returns an MMKV Instance

export const getDeviceConfig = () => {
  try {
    return JSON.parse(MMKV.getString('app_config'));
  } catch (error) {
    return null;
  }
};
export const setDeviceConfig = data => {
  MMKV.setString('app_config', JSON.stringify(data));
};
