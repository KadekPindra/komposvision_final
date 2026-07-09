import { Model } from "@nozbe/watermelondb";
import {
  children,
  field,
  json,
  relation,
} from "@nozbe/watermelondb/decorators";

const sanitizeArray = (value: unknown) => (Array.isArray(value) ? value : []);

export class CompostBatch extends Model {
  static table = "compost_batches";

  @field("user_id") userId!: string;
  @field("title") title!: string;
  @field("status") status!: string;
  @field("image_uri") imageUri!: string;
  @field("ratio") ratio!: string;
  @field("progress") progress!: number;
  @field("summary") summary!: string;
  @field("temperature_c") temperatureC!: number;
  @field("moisture") moisture!: string;
  @field("next_action") nextAction!: string;
  @field("eta_days") etaDays!: number;
  @json("composition", sanitizeArray) composition!: Array<{
    label: string;
    detail: string;
    percent: number;
    tone: "green" | "brown";
  }>;
  @field("last_updated_formatted") lastUpdatedFormatted!: string;
  @field("remote_id") remoteId?: string;
  @field("synced_at") syncedAt?: number;

  @children("compost_activities") activities!: any;
  @relation("profiles", "user_id") profile!: any;
}
