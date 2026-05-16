import { Model } from "@nozbe/watermelondb";
import { field, json, relation, date } from "@nozbe/watermelondb/decorators";

const sanitizeArray = (value: unknown) => (Array.isArray(value) ? value : []);

export class Scan extends Model {
  static table = "scans";

  @field("user_id") userId!: string;
  @field("batch_id") batchId!: string;
  @field("image_uri") imageUri!: string;
  @json("carbon_items", sanitizeArray) carbonItems!: string[];
  @json("nitrogen_items", sanitizeArray) nitrogenItems!: string[];
  @field("estimated_ratio") estimatedRatio!: string;
  @field("ai_instruction") aiInstruction!: string;
  @date("created_at") createdAt!: number;

  @relation("compost_batches", "batch_id") batch!: any;
}
