# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Expo dev server
npm start

# Build and run on Android (requires connected device or emulator)
npx expo run:android

# Lint
npx expo lint

# Reset project scaffold
node ./scripts/reset-project.js
```

Android builds require JDK 17 (`org.gradle.java.home=C:/Program Files/Java/jdk-17` in `android/gradle.properties`).

## Architecture

**KomposVision** is an offline-first React Native app (Expo SDK 54, React Native 0.81.5) that uses on-device TFLite models to analyze compost composition from camera images and tracks composting batches locally.

### Navigation & Screens

Uses **Expo Router** (file-based). Bottom tabs live in `app/(tabs)/`:
- `index.tsx` — Dashboard with active batch list
- `scan.tsx` — Camera capture via `react-native-vision-camera`
- `progress.tsx` — All batches with progress bars
- `chat.tsx` — Offline chatbot using `services/localChatResponder.ts`
- `materials-guide.tsx` — Reference guide for compostable materials

Modal screens: `app/result.tsx` (post-scan analysis + save), `app/progress-detail.tsx`.

Root layout (`app/_layout.tsx`) wraps the app in WatermelonDB's `DatabaseProvider`.

### Data Layer

**WatermelonDB** (SQLite via JSI) is the only persistence layer — no network calls in production. Schema and migrations are in `database/schema.ts` and `database/migrations.ts`. Models are in `database/models/`.

Key tables: `compost_batches`, `compost_activities`, `scans`, `profiles`, `compost_materials`.

When modifying the schema, you must also update `database/migrations.ts` and increment the schema version in `database/schema.ts`.

### AI / ML Pipeline

The scan flow:
1. `services/blurDetection.ts` — rejects blurry images (Laplacian variance < 100)
2. `services/yoloSegmentation.ts` — classifies pixels as Carbon (brown) or Nitrogen (green) materials using a TFLite YOLO model
3. `services/yoloContaminant.ts` — detects non-compostable items (plastic, metal, etc.)
4. `constants/cnRatioTable.ts` — maps detected material labels to C:N ratio scores; ideal target is 25:1
5. `utils/compostAdvisor.ts` — generates advice text and ETA estimate from the ratio

TFLite models are bundled as assets. Metro is configured in `metro.config.js` to accept `.tflite` files. Frame processors use `react-native-worklets-core`.

### Styling

**NativeWind v4** (Tailwind CSS for React Native). Tailwind classes are processed at build time — always run `npx expo start` or rebuild after adding new class names. Config is in `tailwind.config.js`.

### Key Configuration Details

- **New Architecture** is enabled (`newArchEnabled=true`). Native modules must support the new architecture.
- **Hermes** is the JS engine (`hermesEnabled=true`).
- **Babel** (`babel.config.js`) enables legacy decorators — required for WatermelonDB model classes (`@Model`, `@field`, `@relation`, etc.).
- **Path alias**: `@/*` maps to the repo root (configured in `tsconfig.json`).
- `android/gradle.properties` pins `android.packagingOptions.pickFirsts` for `libsqlite.so` and `libc++_shared.so` to resolve native library conflicts.

### Environment Variables

`.env` contains Supabase/API credentials that are **not currently used** — the app is being migrated to fully offline architecture. Do not add new code that reads these values.
