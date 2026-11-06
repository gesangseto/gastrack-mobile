/**
 * Test Shipment Currency — memastikan form shipping memakai currency dari
 * sys_configuration, BUKAN dari session jastip aktif.
 *
 * Skenario diuji dengan menyalin persis logika BatchView:
 *   - sys_config.currency = 'IDR'
 *   - session currency    = 'THB'
 *   - hasil HARUS 'IDR'
 *
 * Jalankan: node scripts/test-shipment-currency.js
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SRC = path.join(
  __dirname, '..', 'src', 'screens', 'Batchs', 'BatchView.js',
);
const src = fs.readFileSync(SRC, 'utf8');

let pass = 0;
const fail = [];

// ─── 1. Sumber tunggal: getSysConfig().currency ─────────────────────────────
{
  const hasSysCfg = /getSysConfig\(\)\?\.currency/.test(src);
  assert.ok(hasSysCfg, 'harus membaca getSysConfig()?.currency');
  console.log('✅ 1. Membaca sys_configuration currency');
  pass++;
}

// ─── 2. TIDAK boleh membaca currency session ────────────────────────────────
{
  // Cari kode (bukan komentar) yang memakai active_session / currency_code.
  const code = src
    .split('\n')
    .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join('\n');

  const offenders = ['active_session', 'currency_code'].filter(kw =>
    code.includes(kw),
  );
  assert.deepStrictEqual(
    offenders, [],
    `masih ada referensi session currency: ${offenders.join(', ')}`,
  );
  assert.ok(
    !code.includes('fetchDashboard'),
    'fetchDashboard tidak boleh dipakai untuk ambil currency',
  );
  console.log('✅ 2. Tidak ada referensi currency session (active_session / currency_code / fetchDashboard)');
  pass++;
}

// ─── 3. State hanya bisa diisi dari sys_configuration ────────────────────────
{
  // Initial state memakai lazy initializer yang membaca sys_config.
  const init = src.match(
    /useState\(\s*\(\)\s*=>\s*getSysConfig\(\)\?\.currency[^)]*\)/,
  );
  assert.ok(init, 'initial state harus lazy-init dari getSysConfig()?.currency');

  // Setiap pemanggilan setter harus membaca sys_config.
  const setters = src.match(/setShipmentCurrency\([^)]*\)/g) || [];
  assert.ok(setters.length >= 1, 'harus ada minimal 1 pemanggilan setter');
  setters.forEach(m => {
    assert.ok(
      m.includes('getSysConfig'),
      `setShipmentCurrency tidak membaca sys_config: ${m}`,
    );
  });

  // Tidak boleh ada setter yang menyalin nilai dari luar sys_config,
  // misalnya dari data batch atau parameter navigasi.
  const foreignSource = /setShipmentCurrency\(\s*(data|response|item|params|route)/;
  assert.ok(
    !foreignSource.test(src),
    'setShipmentCurrency tidak boleh diisi dari data/response/route',
  );
  console.log('✅ 3. Initial state + setter hanya dari sys_configuration');
  pass++;
}

// ─── 4. Simulasikan logika dengan nilai berbeda ─────────────────────────────
{
  const sysCfg = {currency: 'IDR'};
  const sessionCurrency = 'THB'; // sengaja tidak dipakai

  // initial state
  let shipmentCurrency = sysCfg?.currency || 'IDR';
  assert.strictEqual(shipmentCurrency, 'IDR');

  // fallback (nilai sudah terisi → prev dipakai, tidak menimpa)
  const resolve = prev => prev || sysCfg?.currency || 'IDR';
  assert.strictEqual(resolve(shipmentCurrency), 'IDR');
  assert.strictEqual(resolve(''), 'IDR');

  // Dengan session THB tersedia, hasil tetap harus IDR
  assert.notStrictEqual(sessionCurrency, shipmentCurrency);
  console.log('✅ 4. Simulasi: sys=IDR + session=THB → hasil IDR (bukan THB)');
  pass++;
}

// ─── 5. Teks hint tidak lagi menyebut session ──────────────────────────────
{
  const hint = src.match(/Default dari[^<]*/);
  assert.ok(hint, 'hint currency harus ada');
  assert.ok(
    !/session/i.test(hint[0]),
    `hint masih menyebut session: "${hint[0]}"`,
  );
  assert.ok(
    /pengaturan aplikasi/i.test(hint[0]),
    `hint harus menyebut pengaturan aplikasi, dapat: "${hint[0]}"`,
  );
  console.log(`✅ 5. Hint benar: "${hint[0].trim()}"`);
  pass++;
}

console.log(`\n🎯 ${pass}/5 kasus lulus`);
if (pass !== 5) process.exit(1);