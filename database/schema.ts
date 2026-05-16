import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "profiles",
      columns: [
        { name: "full_name", type: "string" },
        { name: "total_compost_kg", type: "number" },
        { name: "created_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "compost_batches",
      columns: [
        { name: "user_id", type: "string" },
        { name: "title", type: "string" },
        { name: "status", type: "string" },
        { name: "image_uri", type: "string" },
        { name: "ratio", type: "string" },
        { name: "progress", type: "number" },
        { name: "summary", type: "string" },
        { name: "temperature_c", type: "number" },
        { name: "moisture", type: "string" },
        { name: "next_action", type: "string" },
        { name: "eta_days", type: "number" },
        { name: "composition", type: "string" },
        { name: "last_updated_formatted", type: "string" },
      ],
    }),
    tableSchema({
      name: "compost_activities",
      columns: [
        { name: "batch_id", type: "string" },
        { name: "title", type: "string" },
        { name: "description", type: "string" },
        { name: "is_active", type: "boolean" },
        { name: "time_label", type: "string" },
        { name: "created_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "scans",
      columns: [
        { name: "user_id", type: "string" },
        { name: "batch_id", type: "string" },
        { name: "image_uri", type: "string" },
        { name: "carbon_items", type: "string" },
        { name: "nitrogen_items", type: "string" },
        { name: "estimated_ratio", type: "string" },
        { name: "ai_instruction", type: "string" },
        { name: "created_at", type: "number" },
      ],
    }),
    tableSchema({
      name: "compost_materials",
      columns: [
        { name: "title", type: "string" },
        { name: "description", type: "string" },
        { name: "label", type: "string" },
        { name: "weight", type: "string" },
      ],
    }),
  ],
});
