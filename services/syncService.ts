import { Q, type Collection, type Model } from "@nozbe/watermelondb";
import { File } from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";

import { database } from "@/database";
import { devicePost } from "@/services/apiClient";

const SYNC_INTERVAL_MS = 60_000;

/** WatermelonDB stores epoch-ms numbers; the backend (Postgres timestamptz) expects ISO 8601 strings. */
const toIso = (ms: number) => new Date(ms).toISOString();

type PushBatch = {
  client_id: string;
  title: string;
  status: string;
  ratio: string;
  progress: number;
  summary: string;
  temperature_c: number;
  moisture: string;
  next_action: string;
  eta_days: number;
  composition: unknown;
  created_at: string;
  updated_at: string;
};

type PushScan = {
  client_id: string;
  batch_client_id: string;
  organic_count: number;
  inorganic_count: number;
  detected_items: string[];
  estimated_ratio: string;
  ai_instruction: string;
  image_base64?: string;
  created_at: string;
  updated_at: string;
};

type PushActivity = {
  client_id: string;
  batch_client_id: string;
  title: string;
  description: string;
  is_active: boolean;
  time_label: string;
  created_at: string;
  updated_at: string;
};

type PushBundle = {
  batches: PushBatch[];
  scans: PushScan[];
  activities: PushActivity[];
};

type PushResponse = {
  batches: { client_id: string; id: string }[];
  scans: { client_id: string; id: string; image_url?: string }[];
  activities: { client_id: string; id: string }[];
  server_time: string;
};

const unsynced = (collection: Collection<Model>) =>
  collection.query(Q.where("synced_at", Q.eq(null))).fetch();

/**
 * WatermelonDB's `@date` decorator returns a `Date` at runtime (model fields
 * are typed `number` for historical reasons in this codebase). Coerce either
 * shape — plus `null`/`undefined` — to a epoch-millisecond number.
 */
function toEpochMs(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return Date.now();
}

/**
 * Reads the local image file at `imageUri` and returns its base64 content,
 * or `undefined` if the file is missing/unreadable. Never throws.
 */
async function readImageBase64(
  imageUri?: string,
): Promise<string | undefined> {
  if (!imageUri) {
    return undefined;
  }

  try {
    const file = new File(imageUri);
    if (!file.exists) {
      return undefined;
    }
    return await file.base64();
  } catch (error) {
    console.log("[Sync] failed to read image for upload", { error });
    return undefined;
  }
}

/**
 * Builds the §6 push bundle from every locally unsynced (synced_at == null)
 * batch, scan, and activity record.
 */
async function buildPushBundle(): Promise<PushBundle> {
  const [batches, scans, activities] = await Promise.all([
    unsynced(database.get("compost_batches")),
    unsynced(database.get("scans")),
    unsynced(database.get("compost_activities")),
  ]);

  // `compost_batches` has no created_at/updated_at columns (out of scope for
  // this slice — see sync report). Batches are mutated in place by
  // getOrCreateActiveBatch rather than re-created, so "now" is used for both
  // timestamps at push time; this is a reasonable LWW reference point.
  const now = Date.now();
  const pushBatches: PushBatch[] = (batches as any[]).map((batch) => ({
    client_id: batch.id,
    title: batch.title ?? "",
    status: batch.status ?? "Aktif",
    ratio: batch.ratio ?? "-",
    progress: typeof batch.progress === "number" ? batch.progress : 0,
    summary: batch.summary ?? "",
    temperature_c:
      typeof batch.temperatureC === "number" ? batch.temperatureC : 0,
    moisture: batch.moisture ?? "Sedang",
    next_action: batch.nextAction ?? "",
    eta_days: typeof batch.etaDays === "number" ? batch.etaDays : 0,
    composition: batch.composition ?? [],
    created_at: toIso(now),
    updated_at: toIso(now),
  }));

  const pushScans: PushScan[] = await Promise.all(
    (scans as any[]).map(async (scan) => {
      const organicItems: string[] = Array.isArray(scan.carbonItems)
        ? scan.carbonItems
        : [];
      const inorganicItems: string[] = Array.isArray(scan.nitrogenItems)
        ? scan.nitrogenItems
        : [];
      // Scans are immutable after creation in the current flow, so
      // updated_at mirrors created_at (no separate updated_at column).
      const createdAtMs = toEpochMs(scan.createdAt);

      return {
        client_id: scan.id,
        batch_client_id: scan.batchId,
        organic_count: organicItems.length,
        inorganic_count: inorganicItems.length,
        detected_items: [...organicItems, ...inorganicItems],
        estimated_ratio: scan.estimatedRatio ?? "-",
        ai_instruction: scan.aiInstruction ?? "",
        image_base64: await readImageBase64(scan.imageUri),
        created_at: toIso(createdAtMs),
        updated_at: toIso(createdAtMs),
      };
    }),
  );

  const pushActivities: PushActivity[] = (activities as any[]).map(
    (activity) => {
      const createdAtMs = toEpochMs(activity.createdAt);
      return {
        client_id: activity.id,
        batch_client_id: activity.batchId,
        title: activity.title ?? "",
        description: activity.description ?? "",
        is_active: !!activity.isActive,
        time_label: activity.timeLabel ?? "",
        created_at: toIso(createdAtMs),
        updated_at: toIso(createdAtMs),
      };
    },
  );

  return { batches: pushBatches, scans: pushScans, activities: pushActivities };
}

/**
 * Writes `remote_id` + `synced_at` back onto every local record that the
 * backend acknowledged in its response.
 */
async function applyPushResponse(response: PushResponse): Promise<void> {
  const now = Date.now();

  await database.write(async () => {
    const writebacks: Promise<unknown>[] = [];

    for (const entry of response.batches ?? []) {
      writebacks.push(
        database
          .get("compost_batches")
          .find(entry.client_id)
          .then((record: any) =>
            record.update((r: any) => {
              r.remoteId = entry.id;
              r.syncedAt = now;
            }),
          )
          .catch((error: unknown) => {
            console.log("[Sync] writeback failed for batch", {
              client_id: entry.client_id,
              error,
            });
          }),
      );
    }

    for (const entry of response.scans ?? []) {
      writebacks.push(
        database
          .get("scans")
          .find(entry.client_id)
          .then((record: any) =>
            record.update((r: any) => {
              r.remoteId = entry.id;
              r.syncedAt = now;
            }),
          )
          .catch((error: unknown) => {
            console.log("[Sync] writeback failed for scan", {
              client_id: entry.client_id,
              error,
            });
          }),
      );
    }

    for (const entry of response.activities ?? []) {
      writebacks.push(
        database
          .get("compost_activities")
          .find(entry.client_id)
          .then((record: any) =>
            record.update((r: any) => {
              r.remoteId = entry.id;
              r.syncedAt = now;
            }),
          )
          .catch((error: unknown) => {
            console.log("[Sync] writeback failed for activity", {
              client_id: entry.client_id,
              error,
            });
          }),
      );
    }

    await Promise.all(writebacks);
  });
}

let syncInFlight = false;

/**
 * Pushes every unsynced batch/scan/activity to `POST /api/ingest/push`,
 * then writes back `remote_id` + `synced_at` for whatever the backend
 * acknowledges. Safe to call repeatedly — no-ops when offline, when there
 * is nothing to sync, or while another sync is already running. Never throws.
 */
export async function syncNow(): Promise<void> {
  if (syncInFlight) {
    return;
  }
  syncInFlight = true;

  try {
    const netState = await NetInfo.fetch().catch(() => null);
    if (netState && netState.isConnected === false) {
      return;
    }

    const bundle = await buildPushBundle();
    if (
      bundle.batches.length === 0 &&
      bundle.scans.length === 0 &&
      bundle.activities.length === 0
    ) {
      return;
    }

    const response = await devicePost<PushResponse>(
      "/api/ingest/push",
      bundle,
    );
    await applyPushResponse(response);
  } catch (error) {
    console.log("[Sync] syncNow failed", { error });
  } finally {
    syncInFlight = false;
  }
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let netInfoUnsubscribe: (() => void) | null = null;

/**
 * Wires up the sync triggers described in spec §8:
 * - periodic interval (every `SYNC_INTERVAL_MS`)
 * - on reconnect (NetInfo transition to connected)
 *
 * `syncNow()` itself should also be called on save (see
 * `services/activeBatch.ts`) and once on app start (see `app/_layout.tsx`).
 * Idempotent and never throws.
 */
export function startSyncTriggers(): void {
  if (intervalHandle == null) {
    intervalHandle = setInterval(() => {
      syncNow().catch(() => {});
    }, SYNC_INTERVAL_MS);
  }

  if (netInfoUnsubscribe == null) {
    try {
      let wasConnected: boolean | null = null;
      netInfoUnsubscribe = NetInfo.addEventListener(
        (state: { isConnected: boolean | null }) => {
          const isConnected = state.isConnected === true;
          if (isConnected && wasConnected === false) {
            syncNow().catch(() => {});
          }
          wasConnected = isConnected;
        },
      );
    } catch (error) {
      console.log("[Sync] failed to subscribe to NetInfo", { error });
    }
  }
}

export const syncService = {
  syncNow,
  startSyncTriggers,
};
