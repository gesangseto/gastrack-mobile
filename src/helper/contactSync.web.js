// Versi WEB dari contactSync.
// Kontak perangkat & permission Android tidak tersedia di browser.
// Semua fungsi dibuat no-op agar pemanggilnya (TabView) tetap aman.
import {normalizePhone, normalizeEmail, normalizeText} from './phone';

export {normalizePhone, normalizeEmail, normalizeText};

const SYNC_FLAG = 'contact_synced';

/** Di web tidak ada permission kontak Android. */
export const requestContactsPermission = async () => false;

/** Di web tidak bisa membaca kontak perangkat. */
export const readContacts = async () => [];

/** Di web sinkronisasi kontak dilewati (no-op). */
export const syncContactsIfNeeded = async () => {
  return;
};
