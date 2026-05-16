import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

import { migrations } from "@/database/migrations";
import { CompostActivity } from "@/database/models/CompostActivity";
import { CompostBatch } from "@/database/models/CompostBatch";
import { CompostMaterial } from "@/database/models/CompostMaterial";
import { Profile } from "@/database/models/Profile";
import { Scan } from "@/database/models/Scan";
import { schema } from "@/database/schema";

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: "komposvision",
  jsi: true,
  onSetUpError: (error) => {
    console.log("[DB] setup error", { error });
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Profile, CompostBatch, CompostActivity, Scan, CompostMaterial],
});
