import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Contacts from 'react-native-contacts';
import Toast from 'react-native-toast-message';
import {storage} from '../storage';
import {syncCustomer} from '../resource/Customer';
import {normalizePhone, normalizeEmail, normalizeText} from './phone';

export {normalizePhone};

const SYNC_FLAG = 'contact_synced';

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
    // Ambil nomor valid pertama dari seluruh nomor kontak
    const phone = (c.phoneNumbers || [])
      .map(p => normalizePhone(p.number))
      .find(Boolean);
    if (!phone || seen.has(phone)) continue; // lewati tanpa nomor / duplikat
    seen.add(phone);

    const name = normalizeText(
      [c.givenName, c.familyName].filter(Boolean).join(' '),
    );
    const email = normalizeEmail(c.emailAddresses?.[0]?.email);
    const addr = c.postalAddresses?.[0];
    const address = addr
      ? normalizeText(
          [addr.street, addr.city, addr.region, addr.postCode]
            .filter(Boolean)
            .join(', '),
        )
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
      storage.set(SYNC_FLAG, true);
    }
  } catch (error) {
    console.log('Contact sync error:', error);
  }
};