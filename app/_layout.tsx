import { database } from "@/database";
import { seedMaterials } from "@/database/helpers/seedMaterials";
import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css";

export default function Layout() {
  useEffect(() => {
    seedMaterials().catch((error) => {
      console.log("[DB] seed failed", { error });
    });
  }, []);

  return (
    <DatabaseProvider database={database}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </DatabaseProvider>
  );
}
