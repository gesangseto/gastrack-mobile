import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import Toast from 'react-native-toast-message';
import {storage} from '../storage';
import {syncCustomer} from '../resource/Customer';

const SYNC_FLAG = 'contact_synced';

/**
 * Normalisasi nomor HP kontak:
 * - Hapus spasi, strip, tanda kurung
 * - Ubah awalan 0 menjadi +62 (Indonesia)
 * - Batasi 18 karakter (sesuai kolom mst_customer.phone)
 */
export const normalizePhone = raw => {
  if (!raw) return null;
  let phone = String(raw).replace(/[\s\-().]/g, '');
  if (phone.startsWith('0')) phone = `+62${phone.slice(1)}`;
  else if (phone.startsWith('62') && !phone.startsWith('+')) {
    phone = `+${phone}`;
  }
  return phone.slice(0, 18) || null;
};

/**
 * Minta permission kontak (Android READ_CONTACTS).
 * @returns {boolean} true jika diizinkan
 */
export const requestContactsPermission = async () => {
  if (Platform.OS !== 'android') return false;
  const permission = PERMISSIONS.ANDROID.READ_CONTACTS;
  const status = await check(permission);
  if (status === RESULTS.GRANTED) return true;
  if (status === RESULTS.DENIED) {
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }
  // BLOCKED / UNAVAILABLE — tidak bisa diminta lagi
  return false;
};

/**
 * Baca kontak dari perangkat dan petakan ke format mst_customer.
 */
export const readContacts = async () => {
  const contacts = await Contacts.getAll();
  const seen = new Set();
  const rows = [];
  for (const c of contacts) {
    const name = [c.givenName, c.familyName].filter(Boolean).join(' ').trim();
    const phone = normalizePhone(c.phoneNumbers?.[0]?.number);
    if (!phone || seen.has(phone)) continue; // lewati tanpa nomor / duplikat
    seen.add(phone);
    const email = c.emailAddresses?.[0]?.email || null;
    const addr = c.postalAddresses?.[0];
    const address = addr
      ? [addr.street, addr.city, addr.region, addr.postCode]
          .filter(Boolean)
          .join(', ')
      : null;
    rows.push({
      name: name || phone, // wajib ada nama
      phone,
      email,
      address,
    });
  }
  return rows;
};

/**
 * Sinkronkan kontak ke mst_customer (hanya sekali per instalasi).
 * Dipanggil saat aplikasi pertama dibuka setelah login.
 */
export const syncContactsIfNeeded = async () => {
  if (storage.getBoolean(SYNC_FLAG)) return; // sudah pernah sync
  const granted = await requestContactsPermission();
  if (!granted) {
    storage.set(SYNC_FLAG, true); // jangan tanya lagi
    return;
  }
  try {
    const contacts = await readContacts();
    if (contacts.length === 0) {
      storage.set(SYNC_FLAG, true);
      return;
    }
    const result = await syncCustomer({contacts});
    if (result) {
      Toast.show({
        type: 'success',
        text1: 'Kontak Tersinkron',
        text2: `${result.inserted || 0} customer baru ditambahkan`,
      });
    }
  } catch (error) {
    console.log('Contact sync error:', error);
  } finally {
    storage.set(SYNC_FLAG, true);
  }
};