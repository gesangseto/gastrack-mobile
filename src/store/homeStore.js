import {create} from 'zustand';
import {storage} from '../storage';
import {fetchDashboard} from '../resource/Dashboard';

const CACHE_KEY = 'home_cache';

// ===== MMKV cache helpers =====
const loadCache = () => {
  try {
    const raw = storage.getString(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.log('loadCache error', e);
    return null;
  }
};

const saveCache = data => {
  try {
    storage.set(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.log('saveCache error', e);
  }
};

// ===== Helper hitung statistik dari dashboard =====
const computeStats = dashboard => {
  const itemByStatus = dashboard?.item_by_status || [];
  const batchByStatus = dashboard?.batch_by_status || [];

  // Item draft (status 200) — sama dengan perilaku lama getListItem({})
  const draftRow = itemByStatus.find(it => Number(it.status) === 200);
  const items = draftRow ? Number(draftRow.total || 0) : 0;

  // Batch aktif = Draft + Shipping
  const batches = batchByStatus
    .filter(b => ['Draft', 'Shipping'].includes(b.status))
    .reduce((acc, b) => acc + Number(b.total || 0), 0);

  // Belum selesai = batch Draft saja (perlu dikirim)
  const unfinish = batchByStatus
    .filter(b => b.status === 'Draft')
    .reduce((acc, b) => acc + Number(b.total || 0), 0);

  return {items, batches, unfinish};
};

// ===== Zustand store =====
export const useHomeStore = create((set, get) => ({
  // Data dashboard mentah (dipakai Statistik juga)
  dashboard: null,
  // Statistik turunan untuk hero Home
  items: 0,
  batches: 0,
  unfinish: 0,
  // Status
  loading: false,
  refreshing: false,
  offline: false,
  hasCache: false,
  lastUpdated: null,

  // Muat cache dari MMKV saat app start (agar langsung tampil tanpa nunggu network)
  initFromCache: () => {
    const cache = loadCache();
    if (cache) {
      set({
        dashboard: cache.dashboard || null,
        items: cache.items || 0,
        batches: cache.batches || 0,
        unfinish: cache.unfinish || 0,
        lastUpdated: cache.lastUpdated || null,
        hasCache: true,
      });
    }
  },

  // Fetch dari backend. Jika gagal (offline) → tampilkan data cache terakhir.
  fetchHome: async (isRefresh = false) => {
    if (isRefresh) {set({refreshing: true});}
    else {set({loading: true});}

    try {
      const dashboard = await fetchDashboard(false);
      if (dashboard) {
        const stats = computeStats(dashboard);
        const payload = {
          dashboard,
          ...stats,
          lastUpdated: new Date().toISOString(),
        };
        saveCache(payload);
        set({...payload, offline: false, hasCache: true});
      } else {
        // Network error → fallback ke cache
        const cache = loadCache();
        if (cache) {
          set({
            dashboard: cache.dashboard || null,
            items: cache.items || 0,
            batches: cache.batches || 0,
            unfinish: cache.unfinish || 0,
            lastUpdated: cache.lastUpdated || null,
            offline: true,
            hasCache: true,
          });
        } else {
          set({offline: true, hasCache: false});
        }
      }
    } catch (e) {
      console.log('fetchHome error', e);
      const cache = loadCache();
      if (cache) {
        set({
          dashboard: cache.dashboard || null,
          items: cache.items || 0,
          batches: cache.batches || 0,
          unfinish: cache.unfinish || 0,
          lastUpdated: cache.lastUpdated || null,
          offline: true,
          hasCache: true,
        });
      } else {
        set({offline: true, hasCache: false});
      }
    } finally {
      set({loading: false, refreshing: false});
    }
  },
}));
