import { database } from "@/database";
import { compostMaterials } from "@/services/materialsGuide";

const DEFAULT_PROFILE_NAME = "Pengguna Offline";

export async function seedMaterials() {
  const materialCollection = database.get("compost_materials");
  const profileCollection = database.get("profiles");

  const existingMaterials = await materialCollection.query().fetch();
  const existingProfiles = await profileCollection.query().fetch();

  if (existingMaterials.length > 0 && existingProfiles.length > 0) {
    return;
  }

  await database.write(async () => {
    if (existingMaterials.length === 0) {
      const allMaterials = [
        ...compostMaterials.carbon,
        ...compostMaterials.nitrogen,
      ];
      for (const material of allMaterials) {
        await materialCollection.create((record) => {
          record.title = material.title;
          record.description = material.description;
          record.label = material.label;
          record.weight = material.weight;
        });
      }
    }

    if (existingProfiles.length === 0) {
      await profileCollection.create((record) => {
        record.fullName = DEFAULT_PROFILE_NAME;
        record.totalCompostKg = 0;
        record.createdAt = new Date().toISOString();
      });
    }
  });
}
