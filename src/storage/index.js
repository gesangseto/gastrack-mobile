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
    if (!endpoint) endpoint = 'http://192.168.0.233:8000';
    return endpoint;
  } catch (error) {
    return null;
  }
};
export const setEndpoint = string => {
  try {
    if (!string) string = 'http://192.168.0.233:8000';
    storage.set('endpoint', string);
    return string;
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
