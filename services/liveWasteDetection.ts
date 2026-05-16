import { CONTAMINANT_CLASSES } from "@/constants/cnRatioTable";

const CLASS_LABEL: Record<string, string> = {
  organic: "Organik",
  inorganic: "Anorganik",
};

const CLASS_COLOR: Record<string, string> = {
  organic: "#22c55e",
  inorganic: "#ef4444",
};

export type WasteClass = {
  id: number;
  label: string;
  type: "organic" | "inorganic";
  color: string;
};

// Diturunkan dari CONTAMINANT_CLASSES agar selalu sinkron dengan model
export const WASTE_CLASSES: WasteClass[] = Object.entries(
  CONTAMINANT_CLASSES,
).map(([id, name]) => ({
  id: Number(id),
  label: CLASS_LABEL[name] ?? name,
  type: name as "organic" | "inorganic",
  color: CLASS_COLOR[name] ?? "#f97316",
}));

export type LiveDetection = {
  classId: number;
  className: string;
  type: "organic" | "inorganic";
  confidence: number;
  color: string;
  /** Koordinat dinormalisasi 0–1 relatif terhadap ukuran layar kamera */
  bbox: { x: number; y: number; width: number; height: number };
};

const CONF_THRESHOLD = 0.4;
const IOU_THRESHOLD = 0.45;
const NUM_ANCHORS = 8400; // YOLO11 default untuk input 640×640

function boxIoU(
  a: [number, number, number, number],
  b: [number, number, number, number],
): number {
  const interW = Math.max(
    0,
    Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]),
  );
  const interH = Math.max(
    0,
    Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]),
  );
  const inter = interW * interH;
  const union = a[2] * a[3] + b[2] * b[3] - inter;
  return union > 0 ? inter / union : 0;
}

/**
 * Parse raw YOLO11 TFLite output tensor ke array LiveDetection.
 *
 * Format output: [1, 4+numClasses, 8400] — flattened ke Float32Array.
 * Layout per elemen: output[channel * NUM_ANCHORS + anchorIdx]
 *   channel 0–3 = cx, cy, w, h (dalam piksel, skala 0–inputSize)
 *   channel 4+  = skor per kelas (0=inorganic, 1=organic)
 *
 * Dipanggil di JS thread via runOnJS, bukan di dalam worklet.
 */
export function parseYoloOutput(
  output: Float32Array,
  numClasses: number,
  inputSize = 640,
): LiveDetection[] {
  type Box = [number, number, number, number];
  type Candidate = { classId: number; conf: number; box: Box };

  const candidates: Candidate[] = [];

  for (let i = 0; i < NUM_ANCHORS; i++) {
    let maxConf = 0;
    let maxClass = 0;
    for (let c = 0; c < numClasses; c++) {
      const conf = output[(4 + c) * NUM_ANCHORS + i];
      if (conf > maxConf) {
        maxConf = conf;
        maxClass = c;
      }
    }
    if (maxConf < CONF_THRESHOLD) continue;

    const cx = output[0 * NUM_ANCHORS + i] / inputSize;
    const cy = output[1 * NUM_ANCHORS + i] / inputSize;
    const w = output[2 * NUM_ANCHORS + i] / inputSize;
    const h = output[3 * NUM_ANCHORS + i] / inputSize;
    candidates.push({
      classId: maxClass,
      conf: maxConf,
      box: [cx - w / 2, cy - h / 2, w, h],
    });
  }

  // Non-maximum suppression
  candidates.sort((a, b) => b.conf - a.conf);
  const suppressed = new Array<boolean>(candidates.length).fill(false);
  const kept: Candidate[] = [];

  for (let i = 0; i < candidates.length; i++) {
    if (suppressed[i]) continue;
    kept.push(candidates[i]);
    for (let j = i + 1; j < candidates.length; j++) {
      if (
        !suppressed[j] &&
        boxIoU(candidates[i].box, candidates[j].box) > IOU_THRESHOLD
      ) {
        suppressed[j] = true;
      }
    }
  }

  return kept.slice(0, 20).map(({ classId, conf, box }) => {
    const cls = WASTE_CLASSES.find((c) => c.id === classId) ?? {
      id: classId,
      label: `Kelas ${classId}`,
      type: "inorganic" as const,
      color: "#f97316",
    };
    return {
      classId,
      className: cls.label,
      type: cls.type,
      confidence: conf,
      color: cls.color,
      bbox: { x: box[0], y: box[1], width: box[2], height: box[3] },
    };
  });
}
