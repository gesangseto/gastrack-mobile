import {MMKV} from 'react-native-mmkv';
export const storage = new MMKV(); // Returns an MMKV Instance

export const setProfile = data => {
  try {
    storage.set('profile', JSON.stringify(data));
  } catch (error) {
    console.log(error);
  }
};
export const getProfile = () => {
  try {
    return JSON.parse(storage.getString('profile'));
  } catch (error) {
    return null;
  }
};
export const getEndpoint = () => {
  try {
    let endpoint = storage.getString('endpoint');
    if (!endpoint) endpoint = 'http://192.168.2.199:8001';
    return endpoint;
  } catch (error) {
    return null;
  }
};
export const removeProfile = () => {
  try {
    return storage.delete('profile');
  } catch (error) {
    return null;
  }
};
