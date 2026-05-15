/**
 * C/N ratio reference table for common composting materials.
 * Values represent the approximate Carbon:Nitrogen ratio.
 *
 * Classes should match YOLOv11-medium-seg output labels.
 */
export type MaterialCNEntry = {
  nameId: string;
  nameDisplay: string;
  cnRatio: number; // C:N where this is the C value per 1 N
  type: "carbon" | "nitrogen";
};

export const CN_RATIO_TABLE: MaterialCNEntry[] = [
  // Model labels (YOLOv11-medium-seg)
  { nameId: "cardboard", nameDisplay: "Kardus", cnRatio: 350, type: "carbon" },
  {
    nameId: "dry-leaves",
    nameDisplay: "Daun Kering",
    cnRatio: 60,
    type: "carbon",
  },
  {
    nameId: "fresh-grass",
    nameDisplay: "Rumput Segar",
    cnRatio: 17,
    type: "nitrogen",
  },
  {
    nameId: "fruit-waste",
    nameDisplay: "Sisa Buah",
    cnRatio: 25,
    type: "nitrogen",
  },
  {
    nameId: "green-leaves",
    nameDisplay: "Daun Hijau",
    cnRatio: 25,
    type: "nitrogen",
  },
  {
    nameId: "sawdust",
    nameDisplay: "Serbuk Kayu",
    cnRatio: 400,
    type: "carbon",
  },
  {
    nameId: "vegetables-waste",
    nameDisplay: "Sisa Sayuran",
    cnRatio: 15,
    type: "nitrogen",
  },
  { nameId: "wood", nameDisplay: "Kayu", cnRatio: 400, type: "carbon" },

  // Additional references (legacy / extended)
  {
    nameId: "daun_kering",
    nameDisplay: "Daun Kering",
    cnRatio: 60,
    type: "carbon",
  },
  {
    nameId: "kertas",
    nameDisplay: "Kertas & Kardus",
    cnRatio: 170,
    type: "carbon",
  },
  { nameId: "kardus", nameDisplay: "Kardus", cnRatio: 350, type: "carbon" },
  {
    nameId: "serbuk_kayu",
    nameDisplay: "Serbuk Kayu",
    cnRatio: 400,
    type: "carbon",
  },
  { nameId: "jerami", nameDisplay: "Jerami", cnRatio: 80, type: "carbon" },
  {
    nameId: "ranting",
    nameDisplay: "Ranting Kering",
    cnRatio: 500,
    type: "carbon",
  },
  { nameId: "sekam", nameDisplay: "Sekam Padi", cnRatio: 75, type: "carbon" },
  {
    nameId: "tongkol_jagung",
    nameDisplay: "Tongkol Jagung",
    cnRatio: 60,
    type: "carbon",
  },
  {
    nameId: "sabut_kelapa",
    nameDisplay: "Sabut Kelapa",
    cnRatio: 80,
    type: "carbon",
  },

  // Nitrogen-rich (green) materials
  {
    nameId: "sisa_sayur",
    nameDisplay: "Sisa Sayuran",
    cnRatio: 15,
    type: "nitrogen",
  },
  {
    nameId: "kulit_buah",
    nameDisplay: "Kulit Buah",
    cnRatio: 35,
    type: "nitrogen",
  },
  {
    nameId: "ampas_kopi",
    nameDisplay: "Ampas Kopi",
    cnRatio: 20,
    type: "nitrogen",
  },
  {
    nameId: "rumput",
    nameDisplay: "Rumput Segar",
    cnRatio: 17,
    type: "nitrogen",
  },
  {
    nameId: "sisa_nasi",
    nameDisplay: "Sisa Nasi",
    cnRatio: 18,
    type: "nitrogen",
  },
  {
    nameId: "sisa_buah",
    nameDisplay: "Sisa Buah",
    cnRatio: 25,
    type: "nitrogen",
  },
  {
    nameId: "ampas_teh",
    nameDisplay: "Ampas Teh",
    cnRatio: 15,
    type: "nitrogen",
  },
  {
    nameId: "kulit_telur",
    nameDisplay: "Kulit Telur",
    cnRatio: 5,
    type: "nitrogen",
  },
  {
    nameId: "kotoran_hewan",
    nameDisplay: "Kotoran Hewan",
    cnRatio: 15,
    type: "nitrogen",
  },
];

/**
 * Lookup a material's C/N data by its model class name.
 * Falls back to a generic organic material if not found.
 */
export function lookupCN(classNameId: string): MaterialCNEntry {
  const found = CN_RATIO_TABLE.find((m) => m.nameId === classNameId);
  if (found) return found;

  // Default fallback for unknown organic materials
  return {
    nameId: classNameId,
    nameDisplay: classNameId.replace(/[_-]/g, " "),
    cnRatio: 30,
    type: "nitrogen",
  };
}

/**
 * YOLO contaminant detection model class labels.
 * Matches the output from YOLOv11-medium contaminant model.
 */
export const CONTAMINANT_CLASSES: Record<number, string> = {
  0: "inorganic",
  1: "organic",
};

/**
 * YOLO segmentation model class labels for organic materials.
 * These should match your trained YOLOv11-medium-seg model.
 */
export const SEGMENTATION_CLASSES: Record<number, string> = {
  0: "cardboard",
  1: "dry-leaves",
  2: "fresh-grass",
  3: "fruit-waste",
  4: "green-leaves",
  5: "sawdust",
  6: "vegetables-waste",
  7: "wood",
};
