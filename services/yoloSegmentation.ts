import { lookupCN, SEGMENTATION_CLASSES } from "@/constants/cnRatioTable";

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
  let totalCarbon = 0;
  let totalNitrogen = 0;
  const carbonItems = new Set<string>();
  const nitrogenItems = new Set<string>();

  detections.forEach((det) => {
    // Resolve class name from SEGMENTATION_CLASSES if not already set
    const nameId =
      det.className || SEGMENTATION_CLASSES[det.classId] || `class_${det.classId}`;
    const info = lookupCN(nameId);

    const area = Math.max(
      1,
      (det.bbox[2] - det.bbox[0]) * (det.bbox[3] - det.bbox[1]),
    );

    // C:N ratio = cnRatio:1, so carbon contribution = area × cnRatio, nitrogen = area × 1
    totalCarbon += area * info.cnRatio;
    totalNitrogen += area;

    if (info.type === "carbon") {
      carbonItems.add(info.nameDisplay);
    } else {
      nitrogenItems.add(info.nameDisplay);
    }
  });

  const ratioValue =
    totalNitrogen > 0 ? Math.round(totalCarbon / totalNitrogen) : 0;

  return {
    carbonItems: Array.from(carbonItems),
    nitrogenItems: Array.from(nitrogenItems),
    ratioText: ratioValue > 0 ? `${ratioValue}:1` : "-",
  };
};

export async function analyzeComposition(
  imageUri: string,
): Promise<CompositionResult> {
  void imageUri;
  // TODO: jalankan TFLite inference dengan yolo11m_seg_cn.tflite dan isi detections
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
