# Jastip Center — Track & Trace Jastip

Aplikasi Android untuk tracking & tracing barang jastip (jasa titip) oleh **Gesang Aji Seto**.

## Tech Stack

| Komponen                        | Versi                         |
| ------------------------------- | ----------------------------- |
| React Native                    | 0.79.2                        |
| React                           | 19.0.0                        |
| New Architecture                | ✅ (Fabric + TurboModules)    |
| Hermes                          | ✅                            |
| minSdk / targetSdk / compileSdk | 24 / 35 / 35                  |
| Gradle                          | 8.13                          |
| Backend                         | Node.js (folder `../Backend`) |

## Prasyarat

| Tool              | Versi         | Catatan                                                                                                                                                      |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Java (JDK)**    | **17**        | ⚠️ **WAJIB 17**. React Native 0.79 / AGP 8.x tidak bisa build dengan Java 11. Path JDK sudah di-pin di `android/gradle.properties` (`org.gradle.java.home`). |
| Node.js           | ≥ 18          |                                                                                                                                                              |
| Android SDK       | compileSdk 35 | Build-tools 35.0.0, platform android-35. Path SDK di `android/local.properties`.                                                                             |
| Device / Emulator | —             | USB debugging aktif                                                                                                                                          |

## Setup

```bash
npm install
```

## Menjalankan Development Mode

### Aplikasi Android (native)

```bash
npm run android
```

Atau manual:

```bash
# Terminal 1 — Metro bundler
npx react-native start

# Terminal 2 — build + install + launch
npx react-native run-android
```

> **Catatan:** endpoint API default `http://192.168.0.233:8000` (lihat `src/storage/index.js`). Pastikan backend berjalan dan IP sesuai jaringan device.

### PWA (versi web) — port 8082

Branch `expo-jastip` menambahkan dukungan web/PWA (Expo + react-native-web).
Kode Android **tidak diubah** — perbedaan platform ditangani file `*.web.js`.

```bash
# Via PM2 (cara utama di server dev)
pm2 start ecosystem.config.js --update-env     # → http://192.168.0.192:8082/

# Manual
npx expo start --web --port 8082
```

PM2 menjalankan `node_modules/expo/bin/cli start --web --port 8082` dengan
interpreter Node v22. **Jangan** set `CI=1` — mematikan hot-reload dan Metro
akan meminta input interaktif yang tidak ada di PM2 (server langsung berhenti).

**Build statis** (untuk uji hasil produksi):

```bash
NODE_ENV=production npx expo export -p web     # → dist/
```

**Konfigurasi endpoint** — di-inline saat build, wajib build ulang setelah diubah:

| File | `EXPO_PUBLIC_API_URL` | `EXPO_PUBLIC_API_URL_WEB` |
| ---- | --------------------- | ------------------------- |
| `.env.development` | `http://192.168.0.192:8081` | `http://192.168.0.192:8081` |
| `.env.production` | `https://api.fiorellaza.com` | `https://api.fiorellaza.com` |

Salin dari template bila belum ada: `cp .env.example .env`

> **Service Worker:** `public/sw.js` punya `CACHE_VERSION` (kini `jastip-v3`).
> **Naikkan versinya setiap deploy build baru**, kalau tidak HP yang sudah
> memasang PWA akan terus memuat app-shell lama dari cache.
>
> **Sesi web:** react-native-mmkv menulis ke `localStorage` dengan prefix
> `mmkv.default\` (mis. `mmkv.default\profile`), bukan nama polos.


## Build Release & Install

```bash
cd android/
./gradlew clean
./gradlew app:assembleRelease
cd ..
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting

### ❌ Build gagal: "Unsupported class file major version" / error Java

**Penyebab:** `JAVA_HOME` menunjuk ke Java 11, sedangkan RN 0.79 butuh Java 17.
**Solusi:**

```bash
# Windows (permanen, buka terminal baru setelahnya)
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
```

Project ini juga sudah mengunci JDK 17 di `android/gradle.properties`, jadi build tetap jalan meski `JAVA_HOME` salah.

### ❌ `adb install` menggantung tanpa output

**Penyebab:** Layar device mati/terkunci.
**Solusi:**

```bash
adb shell input keyevent KEYCODE_WAKEUP
adb shell wm dismiss-keyguard
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### ❌ App tampil tapi `[AxiosError: Network Error]`

**Penyebab:** Backend tidak berjalan atau IP endpoint salah.
**Solusi:** Jalankan backend (`cd ../Backend && npm start`), lalu pastikan IP di `src/storage/index.js` (`getEndpoint()`) sesuai IP server di jaringan yang sama.

### ❌ Metro tidak terhubung / "Unable to load script"

**Solusi:**

```bash
adb reverse tcp:8081 tcp:8081
npx react-native start --reset-cache
```

## Struktur Folder

```
Android/          # Repo ini
  android/        # Native Android (Gradle)
  src/            # Kode aplikasi (screens, components, config, resource)
  assets/         # Asset statis
  public/         # Aset web PWA (sw.js, manifest, icons)
  ecosystem.config.js  # Definisi PM2 app `dev-pwa`
```

Repo terkait (sibling di `/home/gesang/project/jastip/`): `Backend/` (API) dan
`Frontend/` (admin web).
