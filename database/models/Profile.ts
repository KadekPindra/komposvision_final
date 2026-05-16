import { Model } from "@nozbe/watermelondb";
import { field, date } from "@nozbe/watermelondb/decorators";

export class Profile extends Model {
  static table = "profiles";

  @field("full_name") fullName!: string;
  @field("total_compost_kg") totalCompostKg!: number;
  @date("created_at") createdAt!: number;
}
