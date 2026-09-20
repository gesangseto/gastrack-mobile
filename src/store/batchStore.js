import {create} from 'zustand';
import {getListItemBatch} from '../resource/Batch';

// ===== Zustand store untuk list batch (Draft + Shipping) =====
// Data batch dimuat SEKALI saat screen Batch aktif (status Draft + Shipping
// DAN session aktif), lalu tab Draft/Shipping hanya mem-filter data yang
// tersimpan di store (tanpa request ulang ke backend). Pull-to-refresh memuat ulang.
export const useBatchStore = create((set, get) => ({
  // Semua batch status Draft + Shipping (mentah dari backend item-batch)
  list: [],
  loading: false,
  refreshing: false,
  lastUpdated: null,

  // Muat batch Draft + Shipping dari endpoint item-batch.
  // sessionId → filter session aktif (session_id). isRefresh=true → pull-to-refresh.
  fetchBatches: async (sessionId = null, isRefresh = false) => {
    if (isRefresh) {set({refreshing: true});}
    else {set({loading: true});}

    try {
      const params = {status: ['Draft', 'Shipping']};
      if (sessionId) {params.session_id = sessionId;}
      const response = await getListItemBatch(params, false);
      if (Array.isArray(response)) {
        set({list: response, lastUpdated: new Date().toISOString()});
      }
    } catch (e) {
      console.log('fetchBatches error', e);
    } finally {
      set({loading: false, refreshing: false});
    }
  },

  // Kosongkan list (dipakai saat tidak ada session aktif).
  clearBatches: () => set({list: []}),
}));
