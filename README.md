# GasTrack — Track & Trace Jastip

Aplikasi Android untuk tracking & tracing barang jastip (jasa titip) oleh **Gesang Aji Seto**.

## Tech Stack

| Komponen | Versi |
|----------|-------|
| React Native | 0.79.2 |
| React | 19.0.0 |
| New Architecture | ✅ (Fabric + TurboModules) |
| Hermes | ✅ |
| minSdk / targetSdk / compileSdk | 24 / 35 / 35 |
| Gradle | 8.13 |
| Backend | Node.js (folder `../Backend`) |

## Prasyarat

| Tool | Versi | Catatan |
|------|-------|---------|
| **Java (JDK)** | **17** | ⚠️ **WAJIB 17**. React Native 0.79 / AGP 8.x tidak bisa build dengan Java 11. Path JDK sudah di-pin di `android/gradle.properties` (`org.gradle.java.home`). |
| Node.js | ≥ 18 | |
| Android SDK | compileSdk 35 | Build-tools 35.0.0, platform android-35. Path SDK di `android/local.properties`. |
| Device / Emulator | — | USB debugging aktif |

## Setup

```bash
npm install
```

## Menjalankan Development Mode

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
android/          # Project React Native (app ini)
  android/        # Native Android (Gradle)
  src/            # Kode aplikasi (screens, components, config, resource)
  assets/         # Asset statis
Backend/          # API server (Node.js)
Website/          # Web app
```