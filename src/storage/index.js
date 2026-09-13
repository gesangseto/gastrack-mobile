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

// Simpan konfigurasi aplikasi (sys_configuration_mst) ke MMKV.
// Field sensitif (password) dan logo dibuang agar tidak tersimpan di device.
export const setSysConfig = data => {
  try {
    if (!data) return null;
    const {
      users_password,
      db_pwd,
      backup_password,
      identity_logo_path,
      login_logo,
      home_logo,
      ...safe
    } = data;
    storage.set('sys_config', JSON.stringify(safe));
    return safe;
  } catch (error) {
    console.log(error);
    return null;
  }
};
export const getSysConfig = () => {
  try {
    return JSON.parse(storage.getString('sys_config'));
  } catch (error) {
    return null;
  }
};

// ===== Local Setting (pengaturan lokal perangkat) =====
// Menyimpan preferensi device: currency_from, currency_to.
export const getLocalSetting = () => {
  try {
    return JSON.parse(storage.getString('local_setting')) || {};
  } catch (error) {
    return {};
  }
};
export const setLocalSetting = data => {
  try {
    if (!data) return null;
    const current = getLocalSetting();
    const merged = {...current, ...data};
    storage.set('local_setting', JSON.stringify(merged));
    return merged;
  } catch (error) {
    console.log(error);
    return null;
  }
};
