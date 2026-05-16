import { database } from "@/database";
import { generateCompostAdvice } from "@/utils/compostAdvisor";

const findKeyword = (message: string, keywords: string[]) =>
  keywords.some((keyword) => message.includes(keyword));

export async function respondToChat(
  message: string,
  batchId?: string | null,
): Promise<string> {
  const normalized = message.toLowerCase();
  if (!batchId) {
    return "Aku bisa bantu jika kamu memilih konteks progres kompos.";
  }

  let batch: any;
  try {
    batch = await database.get("compost_batches").find(batchId);
  } catch (error) {
    return "Konteks progres tidak ditemukan. Pilih konteks lain ya.";
  }
  const ratio = batch.ratio ?? "25:1";
  const advice = generateCompostAdvice({
    ratio,
    carbonPercent: 50,
    nitrogenPercent: 50,
    batchAgeDays: 5,
    temperatureC: batch.temperatureC ?? 35,
    moisture: batch.moisture ?? "Sedang",
  });

  if (findKeyword(normalized, ["rasio", "cn"])) {
    return `Rasio saat ini ${ratio}. ${advice.summary} ${advice.nextAction}`;
  }

  if (findKeyword(normalized, ["bau", "busuk"])) {
    return "Bau menyengat biasanya karena nitrogen terlalu tinggi atau terlalu basah. Aduk kompos dan tambah bahan coklat.";
  }

  if (findKeyword(normalized, ["air", "basah", "lembab"])) {
    return "Jika terlalu basah, tambahkan bahan coklat kering seperti daun kering atau kardus.";
  }

  return `${advice.summary} ${advice.nextAction}`;
}
