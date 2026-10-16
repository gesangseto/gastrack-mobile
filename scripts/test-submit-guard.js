'use strict';
/**
 * Test offline useSubmitGuard — memastikan double-submit benar-benar ditolak.
 * Dipakai runner react-test-renderer? Tidak: hook murni berbasis ref, jadi
 * kita test dengan reimplementasi minimal semantics yang sama di sini.
 *
 * Yang diuji adalah KONTRAK: guard sinkron berbasis ref.
 * Run: node scripts/test-submit-guard.js
 */
const assert = require('assert');

/** Reimplementasi persis logic useSubmitGuard tanpa React. */
function makeGuard({minMs = 0} = {}) {
  let lock = false;
  let state = false;
  return {
    get busy() {
      return state;
    },
    async submit(fn) {
      if (lock) return undefined;
      lock = true;
      state = true;
      const startedAt = Date.now();
      try {
        return await fn();
      } finally {
        const elapsed = Date.now() - startedAt;
        if (elapsed < minMs) {
          await new Promise(r => setTimeout(r, minMs - elapsed));
        }
        lock = false;
        state = false;
      }
    },
  };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  let pass = 0;

  // 1. Request kedua ditolak saat pertama masih jalan
  {
    let calls = 0;
    const g = makeGuard();
    const slow = g.submit(async () => {
      calls++;
      await sleep(120);
    });
    // Dipanggil pada frame yang SAMA — inilah yang tidak bisa dicegat state.
    const dup = g.submit(async () => {
      calls++;
    });
    const [a, b] = await Promise.all([slow, dup]);
    assert.strictEqual(calls, 1, `double submit harus 1x, actual ${calls}`);
    assert.strictEqual(a, undefined, 'request pertama tetap jalan');
    assert.strictEqual(b, undefined, 'request kedua ditolak (undefined)');
    console.log('✅ 1. double-submit pada frame sama ditolak (1 request)');
    pass++;
  }

  // 2. Setelah selesai, submit lagi harus BERHASIL
  {
    let calls = 0;
    const g = makeGuard();
    await g.submit(async () => { calls++; });
    await g.submit(async () => { calls++; });
    assert.strictEqual(calls, 2, 'submit setelah selesai harus Jalan');
    console.log('✅ 2. submit setelah request selesai berhasil lagi');
    pass++;
  }

  // 3. Error tetap melepas lock (tidak mengunci selamanya)
  {
    let calls = 0;
    const g = makeGuard();
    let threw = false;
    try {
      await g.submit(async () => { calls++; throw new Error('boom'); });
    } catch (_) { threw = true; }
    assert.ok(threw, 'error harus diteruskan');
    await g.submit(async () => { calls++; });
    assert.strictEqual(calls, 2, 'lock harus lepas setelah error');
    assert.strictEqual(g.busy, false, 'busy harus false setelah error');
    console.log('✅ 3. lock lepas meski request gagal');
    pass++;
  }

  // 4. minMs menahan status busy minimal (anti kedip)
  {
    const g = makeGuard({minMs: 150});
    const t0 = Date.now();
    await g.submit(async () => {/* instan */});
    const elapsed = Date.now() - t0;
    assert.ok(elapsed >= 140, `busy harus bertahan ≥140ms, actual ${elapsed}ms`);
    console.log(`✅ 4. minMs menahan loading ${elapsed}ms (tidak berkedip)`);
    pass++;
  }

  // 5. 10 tap bersamaan → tepat 1 request
  {
    let calls = 0;
    const g = makeGuard();
    await Promise.all(
      Array.from({length: 10}, () =>
        g.submit(async () => {
          calls++;
          await sleep(50);
        }),
      ),
    );
    assert.strictEqual(calls, 1, `10 tap harus 1 request, actual ${calls}`);
    console.log('✅ 5. 10 tap bersamaan → tepat 1 request');
    pass++;
  }

  console.log(`\n🎯 ${pass}/5 kasus lulus`);
  if (pass !== 5) process.exit(1);
}

run().catch(e => {
  console.error('❌ TEST GAGAL:', e.message);
  process.exit(1);
});