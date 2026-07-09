import {
  addColumns,
  schemaMigrations,
} from "@nozbe/watermelondb/Schema/migrations";

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: "compost_batches",
          columns: [
            { name: "remote_id", type: "string", isOptional: true },
            { name: "synced_at", type: "number", isOptional: true },
          ],
        }),
        addColumns({
          table: "scans",
          columns: [
            { name: "remote_id", type: "string", isOptional: true },
            { name: "synced_at", type: "number", isOptional: true },
          ],
        }),
        addColumns({
          table: "compost_activities",
          columns: [
            { name: "remote_id", type: "string", isOptional: true },
            { name: "synced_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
  ],
});
