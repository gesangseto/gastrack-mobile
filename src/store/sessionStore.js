import {create} from 'zustand';
import {getSessionList} from '../resource/Session';

// ===== Zustand store untuk active session jastip =====
// Sumber data: Home (fetch saat screen aktif). Dipakai juga sebagai guard
// "Tambah Item" / "Tambah Batch" — create ditolak jika tidak ada session aktif.
export const useSessionStore = create((set, get) => ({
  // Session jastip yang sedang aktif (status Active), atau null jika tidak ada
  activeSession: null,
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

  // Pastikan activeSession terisi (fetch ulang jika masih kosong).
  // Dipakai guard "Tambah Item"/"Tambah Batch" agar tidak menolak padahal
  // session sebenarnya ada (store belum sempat terisi).
  ensureActiveSession: async () => {
    const {activeSession, fetchActiveSession} = get();
    if (activeSession) return activeSession;
    await fetchActiveSession();
    return get().activeSession;
  },

  clearActiveSession: () => set({activeSession: null}),
}));