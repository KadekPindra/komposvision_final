import { CN_RATIO_TABLE } from "@/constants/cnRatioTable";

export type SegmentationDetection = {
  classId: number;
  className: string;
  confidence: number;
  bbox: [number, number, number, number];
};

export type CompositionResult = {
  carbonItems: string[];
  nitrogenItems: string[];
  estimatedRatio: string;
  composition: {
    label: string;
    detail: string;
    percent: number;
    tone: "green" | "brown";
  }[];
};

const calculateRatio = (detections: SegmentationDetection[]) => {
  let carbonScore = 0;
  let nitrogenScore = 0;
  const carbonItems = new Set<string>();
  const nitrogenItems = new Set<string>();

  detections.forEach((det) => {
    const info = CN_RATIO_TABLE[det.className];
    if (!info) return;
    const area = Math.max(
      1,
      (det.bbox[2] - det.bbox[0]) * (det.bbox[3] - det.bbox[1]),
    );
    carbonScore += area * info.carbon;
    nitrogenScore += area * info.nitrogen;
    if (info.carbon >= 30) {
      carbonItems.add(det.className);
    } else {
      nitrogenItems.add(det.className);
    }
  });

  const ratioValue =
    nitrogenScore > 0 ? Math.round(carbonScore / nitrogenScore) : 0;
  const ratioText = ratioValue > 0 ? `${ratioValue}:1` : "-";

  return {
    carbonItems: Array.from(carbonItems),
    nitrogenItems: Array.from(nitrogenItems),
    ratioText,
  };
};

export async function analyzeComposition(
  imageUri: string,
): Promise<CompositionResult> {
  void imageUri;
  const detections: SegmentationDetection[] = [];
  const { carbonItems, nitrogenItems, ratioText } = calculateRatio(detections);

  const totalItems = carbonItems.length + nitrogenItems.length;
  const carbonPercent =
    totalItems > 0 ? Math.round((carbonItems.length / totalItems) * 100) : 50;
  const nitrogenPercent = 100 - carbonPercent;

  return {
    carbonItems,
    nitrogenItems,
    estimatedRatio: ratioText,
    composition: [
      {
        label: "Bahan Hijau (Nitrogen)",
        detail: nitrogenItems.join(", ") || "Belum terdeteksi",
        percent: nitrogenPercent,
        tone: "green",
      },
      {
        label: "Bahan Coklat (Karbon)",
        detail: carbonItems.join(", ") || "Belum terdeteksi",
        percent: carbonPercent,
        tone: "brown",
      },
    ],
  };
}
