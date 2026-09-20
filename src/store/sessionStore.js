import {create} from 'zustand';
import {getSessionList} from '../resource/Session';
import {storage} from '../storage';

const SELECTED_KEY = 'selected_session';

// ===== Persist ke MMKV (pola sama dgn homeStore) =====
const loadSelected = () => {
  try {
    const raw = storage.getString(SELECTED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log('loadSelected err', e);
    return null;
  }
};
const saveSelected = s => {
  try {
    storage.set(SELECTED_KEY, JSON.stringify(s));
  } catch (e) {
    console.log('saveSelected err', e);
  }
};

// ===== Zustand store utk session jastip =====
// Sumber data: Home (fetch saat screen aktif). Dipakai juga sebagai guard
// "Tambah Item" / "Tambah Batch" — create ditolak jika tidak ada session aktif.
//
// Session "terpilih" (selectedSession) adalah sumber tunggal filter utk
// dashboard / Batch / Item / Payment. Default = session aktif. User bisa
// memilih session lampau (termasuk Closed) utk menelusuri/membayar data lama.
// Pilihan di-persist ke MMKV sehingga bertahan antar-session app restart.
export const useSessionStore = create((set, get) => ({
  // Session jastip yang sedang aktif (status Active), atau null jika tidak ada.
  activeSession: null,
  // Daftar SEMUA session (utk picker) — termasuk session lampau/Closed.
  sessionList: [],
  // Session yang sedang terpilih di seluruh menu (null = ikut active).
  selectedSession: loadSelected(),
  loading: false,
  refreshing: false,
  lastUpdated: null,

  // Muat session aktif dari endpoint session (status=Active).
  // isRefresh=true → dipakai setelah stop session (spinner RefreshControl).
  fetchActiveSession: async (isRefresh = false) => {
    if (isRefresh) set({refreshing: true});
    else set({loading: true});

    try {
      const response = await getSessionList({status: 'Active'}, false);
      if (Array.isArray(response)) {
        set({
          activeSession: response[0] || null,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.log('fetchActiveSession error', e);
    } finally {
      set({loading: false, refreshing: false});
    }
  },

  // Muat daftar SEMUA session utk picker (semua status, urut terbaru).
  // Dipanggil oleh Home (Statistik inline) dan layar Batch/Item/Payment.
  fetchSessionList: async (isRefresh = false) => {
    if (isRefresh) set({refreshing: true});
    else set({loading: true});

    try {
      const response = await getSessionList({}, false);
      if (Array.isArray(response)) {
        set({
          sessionList: response,
          lastUpdated: new Date().toISOString(),
        });
        // Jika belum ada pilihan tersimpan → default ke session aktif.
        const {selectedSession, activeSession} = get();
        if (!selectedSession) set({selectedSession: activeSession || null});
      }
    } catch (e) {
      console.log('fetchSessionList error', e);
    } finally {
      set({loading: false, refreshing: false});
    }
  },

  // Pilih session utk seluruh menu (boleh session lampau / Closed).
  // null → ikut session aktif. Persist ke MMKV.
  selectSession: session => {
    const payload = session || null;
    set({selectedSession: payload});
    saveSelected(payload);
  },

  // Pastikan activeSession terisi (fetch ulang jika masih kosong).
  // Dipakai guard "Tambah Item"/"Tambah Batch" agar tidak menolak padahal
  // session sebenarnya ada (store belum sempat terisi).
  ensureActiveSession: async () => {
    const {activeSession, fetchActiveSession} = get();
    if (activeSession) return activeSession;
    await fetchActiveSession();
    return get().activeSession;
  },
  // ===== koreksi: karena subclass fixer tak tersedia, menjaga kompatibilitas,
  // ensureActiveSession tetap dipakai guard create item/batch. =====

  clearActiveSession: () =>
    set({
      activeSession: null,
      selectedSession: null,
    }),
}));
