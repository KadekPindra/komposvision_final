import { Model } from "@nozbe/watermelondb";
import { field, relation, date } from "@nozbe/watermelondb/decorators";

export class CompostActivity extends Model {
  static table = "compost_activities";

  @field("batch_id") batchId!: string;
  @field("title") title!: string;
  @field("description") description!: string;
  @field("is_active") isActive!: boolean;
  @field("time_label") timeLabel!: string;
  @date("created_at") createdAt!: number;
  @field("remote_id") remoteId?: string;
  @field("synced_at") syncedAt?: number;

  @relation("compost_batches", "batch_id") batch!: any;
}
