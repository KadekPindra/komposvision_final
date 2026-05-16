export type ContaminantDetection = {
  classId: number;
  className: string;
  confidence: number;
  bbox: [number, number, number, number];
};

export async function detectContaminantsFromImage(
  imageUri: string,
): Promise<ContaminantDetection[]> {
  void imageUri;
  return [];
}
