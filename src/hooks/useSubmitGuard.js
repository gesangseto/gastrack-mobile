import {useCallback, useRef, useState} from 'react';

/**
 * useSubmitGuard — anti-duplikat submit untuk form yang memanggil API.
 *
 * ═══ MASALAH ═══
 * Pola `const [saving, setSaving] = useState(false)` saja TIDAK mencegah
 * double-submit. `setSaving(true)` baru berefek setelah render berikutnya,
 * jadi dua tap cepat (dalam < 1 frame) keduanya masih melihat `saving ===
 * false` dan dua request terkirim. Untuk create item/payment/batch ini
 * berarti data duplikat di database.
 *
 * ═══ SOLUSI ═══
 * Guard disinkronkan lewat `useRef` — mutasi ref terjadi SYNCHRONOUS di
 * handler, pada frame yang sama, sebelum React sempat render ulang. Efeknya
 * tap kedua langsung tertolak walau dalam frame yang sama.
 *
 * State `busy` hanya untuk keperluan tampilan (status loading tombol).
 *
 * @example
 *   const {submit, busy} = useSubmitGuard();
 *
 *   const onSave = () => submit(async () => {
 *     await createItem(form);   // request axios
 *   });
 *
 *   <LoadingButton busy={busy} onPress={onSave}>Save Item</LoadingButton>
 *
 * @param {number} minMs   Durasi minimum status "busy" (ms). Mencegah
 *                         flash loading yang hanya 1 frame sehingga tidak
 *                         terbaca user. Default 400ms.
 * @returns {{busy: boolean, submit: Function, reset: Function, isBusy: Function}}
 */
export default function useSubmitGuard({minMs = 400} = {}) {
  const [busy, setBusy] = useState(false);
  // Guard sinkron: TIDAK ikut re-render, jadi nilainya selalu akurat
  // pada saat handler dijalankan.
  const lock = useRef(false);

  const submit = useCallback(
    async fn => {
      // Guard sinkron — tolak kalau request sebelumnya belum selesai.
      if (lock.current) return undefined;
      lock.current = true;
      setBusy(true);
      const startedAt = Date.now();
      try {
        return await fn();
      } finally {
        // Pastikan loading tidak berkedip sangat singkat.
        const elapsed = Date.now() - startedAt;
        if (elapsed < minMs) {
          await new Promise(r => setTimeout(r, minMs - elapsed));
        }
        lock.current = false;
        setBusy(false);
      }
    },
    [minMs],
  );

  /** Lepas lock tanpa menjalankan apa pun (mis. saat pindah screen). */
  const reset = useCallback(() => {
    lock.current = false;
    setBusy(false);
  }, []);

  /** Status busy tanpa menyetel state — untuk pengecekan sinkron. */
  const isBusy = useCallback(() => lock.current, []);

  return {busy, submit, reset, isBusy};
}