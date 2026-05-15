export type Detection = {
  classId: number;
  className: string;
  confidence: number;
  bbox: [number, number, number, number];
};

export type LocalScanResult = {
  imageUri: string;
  carbonItems: string[];
  nitrogenItems: string[];
  estimatedRatio: string;
  composition: {
    label: string;
    detail: string;
    percent: number;
    tone: "green" | "brown";
  }[];
  contaminants: Detection[];
  aiInstruction: string;
};
