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
    if (!endpoint) endpoint = 'http://192.168.2.199:8081';
    return endpoint;
  } catch (error) {
    return null;
  }
};
export const setEndpoint = string => {
  try {
    if (!string) string = 'http://192.168.2.199:8082';
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

// ===== Tenant (multi-tenant SaaS) =====
// Kode tenant (subdomain Backend, mis. 'demo') diketik user di layar login.
// Dikirim ke Backend lewat header X-Tenant pada SETIAP request, karena klien
// React Native tidak bisa mengeset header 'Host' (diblokir native layer).
// Kosong = jalur super admin (tanpa tenant).
export const getTenant = () => {
  try {
    return storage.getString('tenant') || '';
  } catch (error) {
    return '';
  }
};
export const setTenant = code => {
  try {
    const clean = String(code || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    if (!clean) {
      storage.delete('tenant');
      return '';
    }
    storage.set('tenant', clean);
    return clean;
  } catch (error) {
    return '';
  }
};
export const removeTenant = () => {
  try {
    return storage.delete('tenant');
  } catch (error) {
    return null;
  }
};

// ===== Tenant Info (multi-tenant SaaS) =====
// Salinan data tenant dari sys_tenant (didapat dari GET
// /api/v1/system/tenant/subdomain/:kode). Dipakai untuk branding (nama, logo,
// warna) & preferensi (currency, country, price_unit_code, dsb) TANPA perlu
// memanggil Backend tiap kali. Berisi SEMUA kolom sys_tenant kecuali password.
// Disimpan terpisah dari 'tenant' (kode) supaya logout tetap bisa menampilkan
// nama tenant di layar login.
export const setTenantInfo = data => {
  try {
    if (!data) return null;
    // Buang field sensitif bila sewaktu-waktu ikut terkirim.
    const {
      password,
      db_password_enc,
      db_password,
      db_host,
      db_port,
      db_name,
      db_user,
      username,
      ...safe
    } = data;
    storage.set('tenant_info', JSON.stringify(safe));
    return safe;
  } catch (error) {
    console.log(error);
    return null;
  }
};
export const getTenantInfo = () => {
  try {
    return JSON.parse(storage.getString('tenant_info'));
  } catch (error) {
    return null;
  }
};
export const removeTenantInfo = () => {
  try {
    return storage.delete('tenant_info');
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
