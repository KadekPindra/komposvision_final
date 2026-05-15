export type BlurResult = {
  isBlurry: boolean;
  score: number;
};

export async function detectBlurFromImage(
  imageUri: string,
  threshold: number = 100,
): Promise<BlurResult> {
  void imageUri;
  const score = 999;
  return { isBlurry: score < threshold, score };
}
