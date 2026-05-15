Sip. Berikut urutan implementasi yang aman agar build tetap bisa jalan di setiap fase (incremental, minim breakage). Ini bukan coding dulu, tapi roadmap eksekusi yang bisa langsung kamu ikuti.

**Tahap 0 — Konfirmasi Input Kritikal**
- Siapkan label map YOLO contaminant dan YOLO seg.
- Pastikan `.tflite` sudah tersedia (nama file final).
- Putuskan model output: bounding box + mask? label? C/N table manual?
Tanpa ini, integrasi inference akan mentok di tahap 3–4.

**Tahap 1 — Infrastruktur Build (aman, tanpa ubah UI)**
1) Update package.json dependencies (tambah native libs, hapus supabase).
2) Update babel.config.js decorators.
3) Update app.json plugins + build-properties.
4) Update metro.config.js add `.tflite` assetExts.
5) Jalankan dev build (expo run) untuk validasi native setup.

**Tahap 2 — Database Layer (tanpa mengganggu UI)**
1) Buat folder `database/` dan semua model + schema + migrations.
2) Tambah `DatabaseProvider` di _layout.tsx.
3) Tambah seed materials dari materialsGuide.ts.
4) Verifikasi database init (tanpa mengganti layar dulu).

**Tahap 3 — Type Refactor**
1) Ganti api.ts ke tipe lokal.
2) Tambahkan tipe output YOLO + tipe WatermelonDB entity.
Tujuannya: nanti UI bisa refactor tanpa konflik tipe.

**Tahap 4 — Rewire Data (Progress + Home + Detail)**
1) Ganti fetch API di app/(tabs)/progress.tsx/progress.tsx) ke query WatermelonDB.
2) Ganti progress-detail.tsx ke WatermelonDB reads/writes.
3) Ganti app/(tabs)/index.tsx/index.tsx) ke WatermelonDB observable.
4) Hapus/abaikan compostProgressStore.ts.

**Tahap 5 — AI Local Services**
1) Tambah `services/yoloContaminant.ts`, `services/yoloSegmentation.ts`, `services/blurDetection.ts`.
2) Tambah `constants/cnRatioTable.ts`.
3) Uji inference dari sample static image (bukan camera dulu).

**Tahap 6 — Scan Screen Overhaul**
1) Ganti app/(tabs)/scan.tsx/scan.tsx) ke VisionCamera.
2) Integrasi frame processor, NMS, overlay Skia.
3) Implement capture -> blur detection -> segmentation -> navigate to result.

**Tahap 7 — Result Screen + Save**
1) Ubah result.tsx untuk memakai output lokal.
2) Simpan scan dan batch ke WatermelonDB.
3) Tambah logic `compostAdvisor.ts` untuk summary/ETA.

**Tahap 8 — Chat Offline**
1) Tambah `services/localChatResponder.ts`.
2) Update app/(tabs)/chat.tsx/chat.tsx) ke responder lokal.

**Tahap 9 — Cleanup**
- Hapus aiService.ts
- Hapus supabase.ts
- Bersihkan semua `API_BASE_URL` + env references.
