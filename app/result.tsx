import CompositionText from "@/components/composition";
import PageHeader from "@/components/PageHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import {
  AntDesign,
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

type AnalyzeResult = {
  id?: string | null;
  user_id: string;
  batch_id?: string | null;
  image_url: string;
  detected_objects: {
    item: string;
    condition: string;
    est_mass_grams: number;
  }[];
  chemical_analysis: {
    total_carbon_index: number;
    total_nitrogen_index: number;
    carbon_nitrogen_ratio_status: string;
    risk_factors: string[];
  };
  compost_prediction: {
    estimated_yield_grams: number;
    days_to_mature: number;
  };
  expert_advice: {
    warning: string;
    action_plan: string;
    additive_suggestion: string[];
  };
};

export default function ResultScreen() {
  const { data, image } = useLocalSearchParams();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4 / 3);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    if (!data || typeof data !== "string") {
      return;
    }

    try {
      const parsed = JSON.parse(data) as AnalyzeResult;
      if (parsed?.detected_objects) {
        setResult(parsed);
      } else {
        console.log("[Result] unsupported scan result shape", { parsed });
      }
    } catch (error) {
      console.log("[Result] failed to parse scan result", { error });
    }
  }, [data]);

  useEffect(() => {
    const imageUrl = result?.image_url ?? (image as string | undefined);
    if (!imageUrl) {
      return;
    }

    Image.getSize(
      imageUrl,
      (width, height) => {
        if (height > 0) {
          setImageAspectRatio(width / height);
        }
      },
      () => {
        setImageAspectRatio(4 / 3);
      },
    );
  }, [image]);

  if (!result) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Memuat hasil...</Text>
      </View>
    );
  }

  const imageUrl = result.image_url;
  const carbonValue = result.chemical_analysis.total_carbon_index;
  const nitrogenValue = result.chemical_analysis.total_nitrogen_index;
  const isBalanced =
    nitrogenValue > 0 &&
    result.chemical_analysis.carbon_nitrogen_ratio_status
      .toLowerCase()
      .includes("balanced");
  const message = isBalanced
    ? "Komposisi seimbang"
    : result.chemical_analysis.carbon_nitrogen_ratio_status;

  const getItemIcon = (itemName: string) => {
    const name = itemName.toLowerCase();

    if (name.includes("jeruk") || name.includes("sitrus")) {
      return { icon: "fruit-citrus", color: "#f59e0b" };
    }

    if (name.includes("tanah") || name.includes("kompos")) {
      return { icon: "shovel", color: "#6b5b47" };
    }

    if (name.includes("kertas") || name.includes("tisu")) {
      return { icon: "file-document-outline", color: "#64748b" };
    }

    return { icon: "leaf", color: "#166534" };
  };

  const header = (
    <PageHeader
      title="Hasil Analisis"
      onBack={() => router.back()}
      rightSlot={<View />}
    />
  );

  return (
    <ScreenWrapper header={header} scrollRef={scrollRef}>
      <View className="flex-1">
        <Text className="text-2xl font-bold">Rangkuman</Text>
        <Text className="text-lg mb-4 text-gray-500">
          Pindaian komposter Anda telah selesai.
        </Text>

        {/* Tab Detail Item */}
        <View className="flex bg-white px-6 py-8 mb-8 rounded-xl shadow-md shadow-gray-200">
          <Text className="text-2xl text-start font-semibold">
            Daftar Bahan
          </Text>
          <View className="mt-4 gap-2">
            {result.detected_objects.map((obj, index) => (
              <View
                key={`${obj.item}-${index}`}
                className="flex-row items-center gap-3 border border-gray-200 rounded-lg px-4 py-3"
              >
                <MaterialCommunityIcons
                  name={getItemIcon(obj.item).icon as never}
                  size={18}
                  color={getItemIcon(obj.item).color}
                />
                <Text className="font-semibold flex-1">
                  {obj.item.charAt(0).toUpperCase() + obj.item.slice(1)}
                </Text>
                <Text className="text-sm font-semibold text-right bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                  {obj.est_mass_grams} g
                </Text>
              </View>
            ))}
          </View>

          {/* Gambar Kompos */}
          <Text className="text-2xl text-start mt-8 font-semibold">Gambar</Text>
          <View className="relative w-full rounded-xl mt-4 overflow-hidden">
            <Image
              source={{ uri: imageUrl }}
              className="w-full"
              resizeMode={isImageExpanded ? "contain" : "cover"}
              style={
                isImageExpanded
                  ? { aspectRatio: imageAspectRatio }
                  : { height: 100 }
              }
            />
            <TouchableOpacity
              onPress={() => setIsImageExpanded((prev) => !prev)}
              className="absolute top-2 right-2 bg-black/70 shadow-md shadow-gray-500 rounded-full w-11 h-11 items-center justify-center"
            >
              {isImageExpanded ? (
                <AntDesign name="compress" size={18} color="white" />
              ) : (
                <AntDesign name="expand" size={18} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Rasio Karbon vs Nitrogen */}
        <View className="flex bg-white px-6 py-8 rounded-xl shadow-md shadow-gray-200">
          <Text className="text-2xl text-center font-semibold">
            Rasio Karbon vs Nitrogen
          </Text>
          <CompositionText carbon={carbonValue} nitrogen={nitrogenValue} />
          <View className="items-center justify-center">
            <View
              className={`px-4 py-3 rounded-full flex-row items-center justify-center ${
                isBalanced ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <Ionicons
                name={
                  isBalanced ? "checkmark-circle-outline" : "warning-outline"
                }
                size={18}
                color={isBalanced ? "#166534" : "#991b1b"}
              />
              <Text
                className={`font-semibold ml-2 ${
                  isBalanced ? "text-green-800" : "text-red-800"
                }`}
              >
                {message}
              </Text>
            </View>
          </View>
          <View className="border-t border-gray-400 w-full flex my-8" />
          <View className="flex-row items-center justify-center gap-6">
            <View className="flex-row items-center justify-center gap-2">
              <FontAwesome
                name="circle"
                size={16}
                color={isBalanced ? "#166534" : "#991b1b"}
              />
              <Text className="text-center text-gray-500">
                Karbon(C) {carbonValue}%
              </Text>
            </View>
            <View className="flex-row items-center justify-center gap-2">
              <FontAwesome
                name="circle"
                size={16}
                color={isBalanced ? "#166534" : "#991b1b"}
              />
              <Text className="text-center text-gray-500">
                Nitrogen(N) {nitrogenValue}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Rekomendasi Tindakan */}
        <View className="flex mt-8 p-6 rounded-xl bg-[#faeee3] border-l-4 border-[#166534]">
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setIsAdviceExpanded((prev) => {
                const next = !prev;
                if (next) {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      scrollRef.current?.scrollToEnd({ animated: true });
                    });
                  });
                }
                return next;
              });
            }}
            className="flex-row items-center gap-4"
          >
            <View className="p-3 rounded-full bg-[#6b5b47]">
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={16}
                color="white"
              />
            </View>
            <Text className="text-xl font-bold flex-1">
              Rekomendasi Tindakan
            </Text>
            <View className="items-center justify-center">
              <AntDesign
                name={isAdviceExpanded ? "up" : "down"}
                size={18}
                color="#6b5b47"
              />
            </View>
          </TouchableOpacity>

          {isAdviceExpanded && (
            <View className="mt-4">
              <Text className="text-gray-600 font-semibold mb-3">
                {result.expert_advice.action_plan}
              </Text>
              <View className="gap-2">
                {result.expert_advice.additive_suggestion.map((item, index) => (
                  <View
                    key={`${item}-${index}`}
                    className="flex-row items-center gap-4 px-4 py-2 bg-white rounded-xl border border-gray-300"
                  >
                    <View className="items-center justify-center">
                      <AntDesign name="plus-circle" size={18} color="black" />
                    </View>
                    <Text className="text-gray-700 flex-1">
                      Tambahkan {item.charAt(0).toUpperCase() + item.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Tab Estimasi Panen */}
        <View className="flex bg-white px-6 py-8 rounded-xl mt-8 shadow-md shadow-gray-200">
          <Text className="text-2xl text-start font-semibold">
            Estimasi Panen
          </Text>
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1 items-center justify-center border border-gray-200 rounded-lg px-4 py-3">
              <MaterialIcons name="scale" size={24} color="#6b5b47" />
              <Text className="font-semibold mt-1 text-gray-600">
                Prediksi Berat
              </Text>
              <Text className="mt-2 font-bold text-2xl">
                ~ {result.compost_prediction.estimated_yield_grams / 1000}kg
              </Text>
            </View>
            <View className="flex-1 items-center justify-center border border-gray-200 rounded-lg px-4 py-3">
              <Entypo name="calendar" size={24} color="#166534" />
              <Text className="font-semibold mt-1 text-gray-600">
                Waktu Matang
              </Text>
              <Text className="mt-2 font-bold text-2xl">
                ~ {result.compost_prediction.days_to_mature} hari
              </Text>
            </View>
          </View>
        </View>

        <View className="flex bg-white px-6 py-8 rounded-xl my-8 shadow-md shadow-gray-200">
          <Text className="text-2xl text-start font-semibold">
            Panduan Bahan
          </Text>
          <View className="mt-4 gap-4 px-4">
            <TouchableOpacity onPress={() => router.push("/materials-guide")}>
              <View className="flex-row items-center gap-4 mt-4">
                <MaterialCommunityIcons
                  name="pine-tree"
                  size={24}
                  color="#705f49"
                  style={{ backgroundColor: "#f2dbbf" }}
                  className="rounded-full p-2"
                />
                <Text className="text-lg font-semibold flex-1">
                  Sumber Karbon
                </Text>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={20}
                  color="black"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/materials-guide")}>
              <View className="flex-row items-center gap-4 mt-4">
                <MaterialCommunityIcons
                  name="leaf"
                  size={24}
                  color="#166534"
                  style={{ backgroundColor: "#d1fae5" }}
                  className="rounded-full p-2"
                />
                <Text className="text-lg font-semibold flex-1">
                  Sumber Nitrogen
                </Text>
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={20}
                  color="black"
                />
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            disabled={saving}
            onPress={async () => {
              if (!apiBaseUrl) {
                Alert.alert("Error", "API base URL belum dikonfigurasi.");
                return;
              }

              setSaving(true);
              try {
                if (!result.batch_id) {
                  const totalItems = result.detected_objects.length || 1;
                  const basePercent = Math.floor(100 / totalItems);
                  let remainder = 100 - basePercent * totalItems;
                  const compositionSource =
                    result.detected_objects.length > 0
                      ? result.detected_objects
                      : [
                          {
                            item: "Hasil scan",
                            condition: "-",
                            est_mass_grams: 0,
                          },
                        ];
                  const composition = compositionSource.map((obj) => {
                    const percent = basePercent + (remainder > 0 ? 1 : 0);
                    remainder = Math.max(0, remainder - 1);
                    const name = obj.item.toLowerCase();
                    const tone =
                      name.includes("sayur") ||
                      name.includes("buah") ||
                      name.includes("rumput") ||
                      name.includes("kopi")
                        ? "green"
                        : "brown";
                    return {
                      label: obj.item,
                      detail: obj.condition,
                      percent,
                      tone,
                    };
                  });

                  const ratio = `${carbonValue}:${nitrogenValue}`;
                  const createResponse = await fetch(
                    `${apiBaseUrl}/api/progress/`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: result.user_id,
                        image_url: result.image_url,
                        title: result.detected_objects[0]?.item ?? "Hasil Scan",
                        ratio,
                        summary: result.expert_advice.warning,
                        temperatureC: 35,
                        moisture: "Sedang",
                        nextAction: result.expert_advice.action_plan,
                        etaDays: result.compost_prediction.days_to_mature,
                        composition,
                      }),
                    },
                  );

                  if (!createResponse.ok) {
                    const errorText = await createResponse.text();
                    throw new Error(
                      errorText ||
                        `Gagal membuat batch (HTTP ${createResponse.status})`,
                    );
                  }

                  const created = await createResponse.json();
                  setResult((prev) =>
                    prev ? { ...prev, batch_id: created.id } : prev,
                  );
                  Alert.alert("Berhasil", "Progress berhasil disimpan.");
                  return;
                }

                const response = await fetch(
                  `${apiBaseUrl}/api/progress/${result.batch_id}`,
                  {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      user_id: result.user_id,
                      progressDelta: 0,
                      status: "Tersimpan",
                      nextAction: result.expert_advice.action_plan,
                      summary: result.expert_advice.warning,
                      activity: {
                        title: "Hasil scan disimpan",
                        time: new Date().toLocaleString("id-ID"),
                        description:
                          "Hasil analisis ditambahkan dari halaman result.",
                        isActive: true,
                      },
                    }),
                  },
                );

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(errorText || "Gagal menyimpan progress");
                }

                Alert.alert("Berhasil", "Progress berhasil disimpan.");
              } catch (error) {
                const message =
                  error instanceof Error ? error.message : "Terjadi kesalahan";
                Alert.alert("Error", message);
              } finally {
                setSaving(false);
              }
            }}
            className="mt-6 bg-green-600 px-5 py-3 rounded-xl items-center"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            <Text className="text-white font-semibold">
              {saving ? "Menyimpan..." : "Simpan Progress"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
}
