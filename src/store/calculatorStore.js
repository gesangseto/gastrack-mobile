import {create} from 'zustand';
import {storage} from '../storage';

const MARKUP_KEY = 'calculator_markup';

// ===== Persist ke MMKV (pola sama seperti sessionStore/homeStore) =====
const loadMarkup = () => {
  try {
    const raw = storage.getString(MARKUP_KEY);
    if (raw != null) {
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : 20;
    }
  } catch (e) {
    console.log('loadMarkup err', e);
  }
  return 20; // default markup 20%
};

const saveMarkup = markup => {
  try {
    storage.set(MARKUP_KEY, String(markup));
  } catch (e) {
    console.log('saveMarkup err', e);
  }
};

// ===== Zustand store untuk kalkulator harga jastip =====
// Menyimpan preferensi yang bertahan antar-session app restart:
// - markup (%) — default 20%
// Rate & currency sengaja TIDAK disimpan di store karena selalu
// mengikuti session aktif (sumber kebenaran: sessionStore).
export const useCalculatorStore = create((set, get) => ({
  // Persentase markup harga (default 20)
  markup: loadMarkup(),

  // Set markup baru, persist ke MMKV
  setMarkup: markup => {
    const n = Number(markup);
    const val = Number.isFinite(n) && n >= 0 ? n : 20;
    set({markup: val});
    saveMarkup(val);
  },

  // Reset markup ke default (20%)
  resetMarkup: () => {
    set({markup: 20});
    saveMarkup(20);
  },
}));
