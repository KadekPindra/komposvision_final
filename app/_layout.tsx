import { database } from "@/database";
import { seedMaterials } from "@/database/helpers/seedMaterials";
import { startSyncTriggers, syncNow } from "@/services/syncService";
import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css";

export default function Layout() {
  useEffect(() => {
    seedMaterials().catch((error) => {
      console.log("[DB] seed failed", { error });
    });

    // One-time sync on app start, plus periodic/reconnect triggers.
    // Guarded so a missing/unreachable backend never throws here.
    syncNow().catch((error) => {
      console.log("[Sync] initial sync failed", { error });
    });
    try {
      startSyncTriggers();
    } catch (error) {
      console.log("[Sync] failed to start triggers", { error });
    }
  }, []);

  return (
    <DatabaseProvider database={database}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </DatabaseProvider>
  );
}
