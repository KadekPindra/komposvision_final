import { Q } from "@nozbe/watermelondb";

import { database } from "@/database";

const DEFAULT_PROFILE_NAME = "Pengguna Offline";
const ACTIVE_STATUS = "Aktif";

/** Small step applied to a batch's progress each time a new scan is appended. */
const SCAN_PROGRESS_STEP = 5;

/**
 * Returns this device's current active batch (status "Aktif"), creating one
 * with sensible defaults if none exists yet. There is one profile per
 * offline device, so "the device's active batch" = the most recently
 * updated batch owned by that profile with status "Aktif".
 */
export async function getOrCreateActiveBatch(): Promise<any> {
  const profiles = await database.get("profiles").query().fetch();
  let profileId = (profiles[0] as any)?.id;

  if (!profileId) {
    await database.write(async () => {
      const profile = await database
        .get("profiles")
        .create((record: any) => {
          record.fullName = DEFAULT_PROFILE_NAME;
          record.totalCompostKg = 0;
          record.createdAt = Date.now();
        });
      profileId = profile.id;
    });
  }

  // Under this flow there is normally at most one "Aktif" batch per device;
  // any pre-existing ones (e.g. from before per-scan batches were merged
  // into a single ongoing process) are left untouched and simply not
  // selected for further appends.
  const existingActive = await database
    .get("compost_batches")
    .query(
      Q.where("user_id", profileId),
      Q.where("status", ACTIVE_STATUS),
      Q.take(1),
    )
    .fetch();

  if (existingActive.length > 0) {
    return existingActive[0];
  }

  return database.write(async () => {
    return database.get("compost_batches").create((record: any) => {
      record.userId = profileId;
      record.title = "Tumpukan Aktif";
      record.status = ACTIVE_STATUS;
      record.imageUri = "";
      record.ratio = "-";
      record.progress = 0;
      record.summary = "Belum ada hasil scan.";
      record.temperatureC = 35;
      record.moisture = "Sedang";
      record.nextAction = "Lakukan scan pertama untuk mulai memantau.";
      record.etaDays = 30;
      record.composition = [
        { label: "Organik", percent: 0, tone: "green" },
        { label: "Anorganik", percent: 0, tone: "brown" },
      ];
      record.lastUpdatedFormatted = new Date().toLocaleString("id-ID");
    });
  });
}

export type ScanAppendInput = {
  imageUri: string;
  organicCount: number;
  inorganicCount: number;
  organicPercent: number;
  inorganicPercent: number;
  detectedItems: string[];
  /** Actionable guidance headline — stored on the batch + activity. */
  summary: string;
  /** Factual detection summary (e.g. "Terdeteksi 2 organik..."). */
  aiInstruction: string;
};

/**
 * Appends a scan (+ activity) to `batch` and updates the batch's rolling
 * organic/inorganic snapshot and progress. Keeps the honest organic/inorganic
 * data produced by the live detector in `app/result.tsx` — no values are
 * fabricated here.
 */
export async function appendScanToBatch(
  batch: any,
  input: ScanAppendInput,
): Promise<{ scan: any; activity: any }> {
  // app/(tabs)/scan.tsx orders detectedItems as organic-then-inorganic.
  const organicItems = input.detectedItems.slice(0, input.organicCount);
  const inorganicItems = input.detectedItems.slice(input.organicCount);

  const ratioLabel = `${input.organicCount}:${input.inorganicCount}`;
  const timeLabel = new Date().toLocaleString("id-ID");

  return database.write(async () => {
    const scan = await database.get("scans").create((record: any) => {
      record.userId = batch.userId;
      record.batchId = batch.id;
      record.imageUri = input.imageUri;
      record.carbonItems = organicItems;
      record.nitrogenItems = inorganicItems;
      record.estimatedRatio = ratioLabel;
      record.aiInstruction = input.aiInstruction;
      record.createdAt = Date.now();
    });

    const activity = await database
      .get("compost_activities")
      .create((record: any) => {
        record.batchId = batch.id;
        record.title = "Hasil scan disimpan";
        record.description = input.summary;
        record.isActive = true;
        record.timeLabel = timeLabel;
        record.createdAt = Date.now();
      });

    await batch.update((record: any) => {
      record.imageUri = input.imageUri;
      record.summary = input.summary;
      record.ratio = ratioLabel;
      record.progress = Math.max(
        0,
        Math.min(100, (batch.progress ?? 0) + SCAN_PROGRESS_STEP),
      );
      record.composition = [
        {
          label: "Organik",
          percent: input.organicPercent,
          tone: "green",
        },
        {
          label: "Anorganik",
          percent: input.inorganicPercent,
          tone: "brown",
        },
      ];
      record.lastUpdatedFormatted = timeLabel;
    });

    return { scan, activity };
  });
}
