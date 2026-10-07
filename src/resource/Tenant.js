import $axios from '../config/Api';
import {setTenantInfo, getTenantInfo} from '../storage';

// Endpoint PUBLIK resolusi tenant (tanpa token): mengembalikan info tenant
// (branding + preferensi) berdasarkan kode subdomain. Dipakai klien menyimpan
// "tenant-info" di MMKV supaya tidak perlu memanggil Backend tiap saat.
const subdomainUrl = subdomain =>
  `/api/v1/system/tenant/subdomain/${encodeURIComponent(
    String(subdomain || '')
      .trim()
      .toLowerCase(),
  )}`;

/**
 * Ambil info tenant dari Backend lalu simpan ke MMKV (tenant_info).
 * @param {string} subdomain kode tenant (mis. 'demo'); bila kosong pakai yg tersimpan.
 * @returns {Promise<object|false>} info tenant yang tersimpan, atau false.
 */
export const fetchTenantInfo = async (subdomain, useAlert = false) => {
  const code = subdomain || getTenantInfo()?.subdomain;
  if (!code) return false;
  return new Promise(resolve => {
    $axios
      .get(subdomainUrl(code))
      .then(result => {
        const data = result.data;
        if (data.error || !data.data || !data.data[0]) {
          return resolve(false);
        }
        const saved = setTenantInfo(data.data[0]);
        return resolve(saved || data.data[0]);
      })
      .catch(e => {
        if (useAlert) console.log('fetchTenantInfo error', e.message);
        return resolve(false);
      });
  });
};
