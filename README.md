# 🍃 KomposVision

**KomposVision** adalah aplikasi mobile pintar yang membantu Anda memonitor, mengelola, dan mengoptimalkan proses pembuatan kompos di rumah. Dengan memanfaatkan kamera smartphone, KomposVision dapat menganalisis tingkat keseimbangan rasio bahan pada tumpukan kompos Anda dan memberikan rekomendasi praktis.

---

## ✨ Fitur Utama

- 📸 **Pemindai Cerdas (Smart Scan)**: Ambil foto kompos Anda secara langsung atau pilih dari galeri ponsel. Aplikasi akan menyimulasikan pemrosesan gambar untuk menganalisis rasio Karbon dan Nitrogen.
- 📊 **Dasbor Kesehatan Kompos**: Pantau metrik kemajuan penguraian kompos, jumlah sampah yang terurai, serta kumpulkan Poin Eco (Eco Points).
- 💡 **Rekomendasi & Tips Otomatis**: Dapatkan saran real-time untuk menjaga kualitas kompos (misal: perlu tambahan bahan "Hijau/Nitrogen" atau bahan "Coklat/Karbon").
- 🕒 **Riwayat Aktivitas**: Lacak riwayat penambahan material organik secara historis.

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan _tech stack_ mobile modern:

- **[React Native](https://reactnative.dev/)** - Framework pengembangan aplikasi mobile cross-platform.
- **[Expo](https://expo.dev/)** - Toolchain dan platform development (menggunakan Expo SDK 54).
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based routing navigation.
- **[NativeWind](https://www.nativewind.dev/) (Tailwind CSS v3)** - Styling untuk mengimplementasikan antarmuka modern dengan mudah.

## 🚀 Cara Menjalankan Proyek (Getting Started)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di lingkungan pengembangan lokal Anda.

### Persyaratan Sistem

- **Node.js** (direkomendasikan versi LTS)
- **Git**
- **npm**, **yarn**, atau **pnpm** (pilih salah satu)
- **Expo Go** di HP Android/iOS (opsional jika menggunakan Emulator/Simulator)
- **Android Studio** (opsional, jika ingin menjalankan di Android Emulator)
- **Xcode** (opsional, jika ingin menjalankan di iOS Simulator - macOS saja)

### 1) Clone repositori

```bash
git clone https://github.com/KadekPindra/komposvision.git
cd komposvision
```

### 2) Install dependensi

Pilih salah satu perintah berikut:

```bash
npm install
```

atau

```bash
yarn
```

atau

```bash
pnpm install
```

### 3) Siapkan file environment (.env)

Proyek ini menggunakan beberapa variabel environment. Buat file `.env` di root proyek (jika belum ada).

Contoh isi `.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
```

Keterangan singkat:

- **EXPO_PUBLIC_SUPABASE_URL** dan **EXPO_PUBLIC_SUPABASE_ANON_KEY**: isi dari proyek Supabase Anda.
- **EXPO_PUBLIC_API_BASE_URL**: URL backend lokal. Jika backend berjalan di laptop/PC Anda, gunakan IP lokal (contoh `192.168.x.x`) dan pastikan HP Anda berada di jaringan Wi-Fi yang sama.

### 4) Jalankan development server

```bash
npx expo start
```

### 5) Buka aplikasi

- **Perangkat asli**: Scan QR Code menggunakan **Expo Go** (Android) atau **Kamera** (iOS).
- **Emulator Android**: Tekan `a` di terminal.
- **iOS Simulator**: Tekan `i` di terminal (macOS saja).

---

## ✅ Cek Cepat (Jika Aplikasi Tidak Muncul)

- Pastikan Node.js versi LTS terpasang: `node -v`.
- Pastikan HP dan laptop berada pada Wi-Fi yang sama.
- Jika error terkait dependency, coba hapus cache dan install ulang:
  ```bash
  rm -rf node_modules
  npm install
  npx expo start -c
  ```
- Jika QR tidak bisa dibuka, gunakan mode **Tunnel** di menu Expo DevTools.

## 📁 Struktur Folder

Berikut adalah gambaran umum dari struktur direktori pada repositori ini:

```text
komposvision/
├── app/               # Folder utama berbasis Expo Router (Layar dan Navigasi)
│   ├── (tabs)/        # Layar-layar pada Bottom Tab Navigation (Home, Scan, dll)
│   ├── _layout.tsx    # File konfigurasi navigasi dan layout global
│   └── result.tsx     # Layar untuk menampilkan hasil analisis foto kompos
├── assets/            # Kumpulan gambar statis, ikon, dan font
├── components/        # Komponen UI independen (ScreenWrapper, dll)
├── constants/         # Variabel statis, tema, dan warna global
├── hooks/             # Custom React Hooks
├── scripts/           # Script tambahan pengelolaan proyek
├── services/          # Kumpulan logika integrasi eksternal atau AI
└── tailwind.config.js # Konfigurasi *styling* dari NativeWind/Tailwind
```

## 🤝 Kontribusi

Kontribusi dari komunitas akan sangat dihargai! Jika Anda menemukan _bug_ atau ingin menambahkan fitur baru, silakan buka **Issue** baru atau _submit_ **Pull Request**.

---

_Dibuat dengan ❤️ untuk lingkungan yang lebih hijau._
