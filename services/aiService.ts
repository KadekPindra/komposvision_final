export const analyzeImage = async (imageUri: string) => {
  return {
    detected_objects: [
      {
        item: "kulit jeruk/buah sitrus",
        condition: "basah",
        est_mass_grams: 450,
      },
      {
        item: "tanah/kompos matang (sebagai inokulan)",
        condition: "lembab",
        est_mass_grams: 200,
      },
      { item: "sampah kertas/tisu", condition: "kering", est_mass_grams: 20 },
    ],
    chemical_analysis: {
      total_carbon_index: 4,
      total_nitrogen_index: 7,
      carbon_nitrogen_ratio_status: "terlalu rendah",
      risk_factors: [
        "risiko bau asam (fermentasi anaerob)",
        "risiko lalat buah",
        "keasaman tinggi akibat minyak atsiri kulit jeruk",
      ],
    },
    compost_prediction: {
      estimated_yield_grams: 350,
      days_to_mature: 45,
    },
    expert_advice: {
      warning:
        "Kadar nitrogen terlalu tinggi dan keasaman berlebih dari kulit jeruk dapat menghambat aktivitas bakteri pengurai.",
      action_plan:
        "Aduk tumpukan untuk aerasi, tambahkan material karbon cokelat (daun kering atau serutan kayu) untuk menetralkan pH dan mengurangi bau.",
      additive_suggestion: ["daun kering", "serutan kayu"],
    },
  };
};
