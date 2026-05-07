export type CompostItem = {
  id: string;
  image: string;
  date: string;
  ratio: string;
  title: string;
  status: string;
  progress: number;
  summary: string;
  temperatureC: number;
  moisture: "Rendah" | "Sedang" | "Tinggi";
  nextAction: string;
  etaDays: number;
  composition: {
    label: string;
    detail: string;
    percent: number;
    tone: "green" | "brown";
  }[];
  activities: {
    title: string;
    time: string;
    description: string;
    isActive: boolean;
  }[];
};

export const compostProgressData: CompostItem[] = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400",
    date: "12 Okt 2023, 08:30",
    ratio: "25:1",
    title: "Campuran Dapur Harian",
    status: "Sedang Terurai",
    progress: 45,
    summary:
      "Tumpukan masih aktif menghangat. Butuh aerasi ringan agar tidak terlalu lembab.",
    temperatureC: 42,
    moisture: "Sedang",
    nextAction: "Aduk tumpukan dan tambahkan daun kering tipis.",
    etaDays: 18,
    composition: [
      {
        label: "Bahan Hijau (Nitrogen)",
        detail: "Sisa sayur, kulit buah",
        percent: 45,
        tone: "green",
      },
      {
        label: "Bahan Coklat (Karbon)",
        detail: "Daun kering, kardus",
        percent: 55,
        tone: "brown",
      },
    ],
    activities: [
      {
        title: "Ditambahkan pagi ini",
        time: "Hari ini",
        description: "Sisa potongan sayur dan kulit buah.",
        isActive: true,
      },
      {
        title: "Aduk campuran dilakukan",
        time: "Kemarin",
        description: "Memastikan aerasi oksigen optimal.",
        isActive: false,
      },
    ],
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400",
    date: "05 Okt 2023, 16:15",
    ratio: "40:1",
    title: "Tumpukan Daun Kering",
    status: "Hampir Matang",
    progress: 85,
    summary:
      "Struktur sudah gembur dan bau tanah mulai terasa. Tinggal finishing.",
    temperatureC: 33,
    moisture: "Rendah",
    nextAction: "Semprot air tipis lalu tutup rapat 2-3 hari.",
    etaDays: 5,
    composition: [
      {
        label: "Bahan Hijau (Nitrogen)",
        detail: "Sisa dapur matang",
        percent: 35,
        tone: "green",
      },
      {
        label: "Bahan Coklat (Karbon)",
        detail: "Daun kering, jerami",
        percent: 65,
        tone: "brown",
      },
    ],
    activities: [
      {
        title: "Pembalikan terakhir",
        time: "2 hari lalu",
        description: "Merapikan tekstur dan meratakan panas.",
        isActive: true,
      },
      {
        title: "Penyiraman tipis",
        time: "4 hari lalu",
        description: "Menjaga kelembapan agar stabil.",
        isActive: false,
      },
    ],
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
    date: "15 Okt 2023, 09:00",
    ratio: "20:1",
    title: "Ampas Kopi Pagi",
    status: "Tahap Awal",
    progress: 15,
    summary: "Mulai terasa hangat, namun rasio nitrogen masih tinggi.",
    temperatureC: 38,
    moisture: "Tinggi",
    nextAction: "Tambahkan bahan coklat untuk menyeimbangkan.",
    etaDays: 28,
    composition: [
      {
        label: "Bahan Hijau (Nitrogen)",
        detail: "Ampas kopi, sisa buah",
        percent: 60,
        tone: "green",
      },
      {
        label: "Bahan Coklat (Karbon)",
        detail: "Kardus, serbuk kayu",
        percent: 40,
        tone: "brown",
      },
    ],
    activities: [
      {
        title: "Mulai pemanasan",
        time: "Hari ini",
        description: "Mikroba aktif mulai meningkat.",
        isActive: true,
      },
      {
        title: "Tambahan bahan baru",
        time: "Kemarin",
        description: "Ampas kopi ditambahkan.",
        isActive: false,
      },
    ],
  },
];

export const getCompostItemById = (id: string) =>
  compostProgressData.find((item) => item.id === id);
