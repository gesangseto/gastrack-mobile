import {create} from 'zustand';
import {getSessionList} from '../resource/Session';
import {storage} from '../storage';

const SELECTED_KEY = 'selected_session';
const SESSION_LIST_KEY = 'session_list_cache';

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

// ===== Cache daftar session (dropdown "Per Session Jastip") =====
// Disimpan di MMKV agar pindah-pindah menu tidak perlu fetch ulang;
// refresh hanya via pull-to-refresh.
const loadSessionListCache = () => {
  try {
    const raw = storage.getString(SESSION_LIST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log('loadSessionListCache err', e);
    return null;
  }
};
const saveSessionListCache = list => {
  try {
    storage.set(SESSION_LIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.log('saveSessionListCache err', e);
  }
};
const clearSessionListCache = () => {
  try {
    storage.delete(SESSION_LIST_KEY);
  } catch (e) {
    console.log('clearSessionListCache err', e);
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
  hasSessionCache: false,

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
        saveSessionListCache(response);
        set({
          sessionList: response,
          hasSessionCache: true,
          lastUpdated: new Date().toISOString(),
        });
        // Sinkronkan session terpilih: jika belum ada pilihan → default ke
        // session aktif (dari response); jika sudah ada → perbarui datanya
        // dgn hasil fetch terbaru (misal status berubah) lalu persist MMKV.
        const {selectedSession} = get();
        if (!selectedSession) {
          const active = response.find(s => s.status === 'Active');
          set({selectedSession: active || null});
        } else {
          const fresh = response.find(s => s.id === selectedSession.id);
          if (fresh) {
            set({selectedSession: fresh});
            saveSelected(fresh);
          }
        }
      }
    } catch (e) {
      console.log('fetchSessionList error', e);
    } finally {
      set({loading: false, refreshing: false});
    }
  },

  // Muat daftar session dari cache MMKV (tanpa network). Jika belum ada
  // cache (app baru pertama kali) → fetch dari backend sekali.
  initSessionListFromCache: async () => {
    const cache = loadSessionListCache();
    if (cache && Array.isArray(cache) && cache.length > 0) {
      set({sessionList: cache, hasSessionCache: true});
      // Default pilihan ke session aktif jika belum ada pilihan tersimpan
      // (dipakai bersama oleh Home/Statistik & Payment).
      const {selectedSession} = get();
      if (!selectedSession) {
        const active = cache.find(s => s.status === 'Active');
        if (active) {
          set({selectedSession: active});
          saveSelected(active);
        }
      }
      return;
    }
    await get().fetchSessionList();
  },

  // Set daftar session langsung (dipakai DropDownPicker setItems).
  setSessionList: list => set({sessionList: list}),

  // Hapus cache daftar session (dipakai setelah buka/tutup session agar
  // dropdown tidak menampilkan data basi).
  invalidateSessionList: () => {
    clearSessionListCache();
    set({hasSessionCache: false});
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
