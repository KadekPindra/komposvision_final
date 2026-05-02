export const analyzeImage = async (imageUri: string) => {
  return {
    carbon: 70,
    nitrogen: 30,
    items: [
      { label: "Daun Kering", type: "C" },
      { label: "Kulit Buah", type: "N" },
    ],
  };
};