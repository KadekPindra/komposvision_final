# 🍃 KomposVision

**KomposVision** adalah aplikasi mobile pintar yang membantu Anda memonitor, mengelola, dan mengoptimalkan proses pembuatan kompos di rumah. Dengan memanfaatkan kamera smartphone, KomposVision dapat menganalisis tingkat keseimbangan rasio bahan pada tumpukan kompos Anda dan memberikan rekomendasi praktis.

---

## ✨ Fitur Utama

- 📸 **Pemindai Cerdas (Smart Scan)**: Ambil foto kompos Anda secara langsung atau pilih dari galeri ponsel. Aplikasi akan menyimulasikan pemrosesan gambar untuk menganalisis rasio Karbon dan Nitrogen.
- 📊 **Dasbor Kesehatan Kompos**: Pantau metrik kemajuan penguraian kompos, jumlah sampah yang terurai, serta kumpulkan Poin Eco (Eco Points).
- 💡 **Rekomendasi & Tips Otomatis**: Dapatkan saran real-time untuk menjaga kualitas kompos (misal: perlu tambahan bahan "Hijau/Nitrogen" atau bahan "Coklat/Karbon").
- 🕒 **Riwayat Aktivitas**: Lacak riwayat penambahan material organik secara historis.

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan *tech stack* mobile modern:
- **[React Native](https://reactnative.dev/)** - Framework pengembangan aplikasi mobile cross-platform.
- **[Expo](https://expo.dev/)** - Toolchain dan platform development (menggunakan Expo SDK 54).
- **[Expo Router](https://docs.expo.dev/router/introduction/)** - File-based routing navigation.
- **[NativeWind](https://www.nativewind.dev/) (Tailwind CSS v3)** - Styling untuk mengimplementasikan antarmuka modern dengan mudah.

## 🚀 Cara Menjalankan Proyek (Getting Started)

Ikuti langkah-langkah di bawah ini untuk menjalankan proyek di lingkungan pengembangan lokal Anda.

### Persyaratan Sistem
- Node.js (direkomendasikan versi LTS)
- npm, yarn, atau pnpm
- Aplikasi **Expo Go** terinstal di HP Android/iOS Anda (opsional jika menggunakan Emulator/Simulator).

### Langkah-langkah Instalasi

1. **Clone repositori ini**:
   ```bash
   git clone https://github.com/KadekPindra/komposvision.git
   cd komposvision
   ```

2. **Instal seluruh dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan *development server***:
   ```bash
   npx expo start
   ```

4. **Buka Aplikasi**:
   - **Perangkat Asli**: Pindai QR Code yang muncul di terminal/browser menggunakan aplikasi **Expo Go** (untuk Android) atau aplikasi **Kamera bawaan** (untuk iOS).
   - **Emulator/Simulator**: Tekan tombol `a` di terminal untuk membuka di Android Emulator, atau tekan `i` untuk iOS Simulator.

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

Kontribusi dari komunitas akan sangat dihargai! Jika Anda menemukan *bug* atau ingin menambahkan fitur baru, silakan buka **Issue** baru atau *submit* **Pull Request**.

---
*Dibuat dengan ❤️ untuk lingkungan yang lebih hijau.*
