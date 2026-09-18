import {create} from 'zustand';
import {getListItemStock} from '../resource/Item';

// ===== Zustand store untuk list item (status 200, 201, 202) =====
// Data item dimuat SEKALI saat screen Item aktif (status 200/201/202),
// lalu tab Draft/On Batch/On Shipping hanya mem-filter data yang tersimpan
// di store (tanpa request ulang ke backend). Pull-to-refresh memuat ulang.
export const useItemStore = create((set, get) => ({
  // Semua item status 200/201/202 (mentah dari backend item-stock)
  list: [],
  loading: false,
  refreshing: false,
  lastUpdated: null,

  // Muat item status 200/201/202 dari endpoint item-stock.
  // isRefresh=true → dipakai pull-to-refresh (spinner RefreshControl).
  fetchItems: async (isRefresh = false) => {
    if (isRefresh) set({refreshing: true});
    else set({loading: true});

    try {
      const response = await getListItemStock(
        {status: [200, 201, 202]},
        false,
      );
      if (Array.isArray(response)) {
        set({list: response, lastUpdated: new Date().toISOString()});
      }
    } catch (e) {
      console.log('fetchItems error', e);
    } finally {
      set({loading: false, refreshing: false});
    }
  },
}));