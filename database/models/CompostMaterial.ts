import { Model } from "@nozbe/watermelondb";
import { field } from "@nozbe/watermelondb/decorators";

export class CompostMaterial extends Model {
  static table = "compost_materials";

  @field("title") title!: string;
  @field("description") description!: string;
  @field("label") label!: string;
  @field("weight") weight!: string;
}
