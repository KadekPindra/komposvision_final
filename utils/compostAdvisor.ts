type MoistureLevel = "Rendah" | "Sedang" | "Tinggi";

const parseRatioValue = (ratio: string) => {
  const match = ratio.match(/(\d+(?:\.\d+)?)\s*:\s*1/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

export function generateCompostAdvice(params: {
  ratio: string;
  carbonPercent: number;
  nitrogenPercent: number;
  batchAgeDays: number;
  temperatureC: number;
  moisture: MoistureLevel;
}): {
  summary: string;
  nextAction: string;
  etaDays: number;
} {
  const ratioValue = parseRatioValue(params.ratio);
  const ratioScore = ratioValue ?? 25;
  const distance = Math.abs(ratioScore - 25);
  const baseEta = Math.max(7, 30 - Math.round(params.batchAgeDays / 2));
  const etaDays = Math.max(5, baseEta + Math.round(distance / 2));

  if (ratioScore > 30) {
    return {
      summary: "Rasio karbon terlalu tinggi, proses bisa melambat.",
      nextAction: "Tambahkan bahan hijau seperti sisa sayur atau rumput segar.",
      etaDays,
    };
  }

  if (ratioScore < 20) {
    return {
      summary: "Rasio nitrogen terlalu tinggi, risiko bau meningkat.",
      nextAction: "Tambahkan bahan coklat seperti daun kering atau kardus.",
      etaDays,
    };
  }

  return {
    summary: "Rasio kompos seimbang, lanjutkan perawatan rutin.",
    nextAction: "Pertahankan kelembapan dan lakukan aerasi berkala.",
    etaDays,
  };
}
