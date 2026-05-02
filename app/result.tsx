import CompositionText from "@/components/composition";
import PageHeader from "@/components/PageHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { analyzeImage } from "@/services/aiService";
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
  const { image } = useLocalSearchParams();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4 / 3);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  useEffect(() => {
    let isActive = true;

    const fetchResult = async () => {
      const data = await analyzeImage(image as string);
      if (isActive) {
        setResult(data);
      }
    };

    fetchResult();

    return () => {
      isActive = false;
    };
  }, [image]);

  useEffect(() => {
    if (!image) {
      return;
    }

    Image.getSize(
      image as string,
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
        <Text>Analyzing...</Text>
      </View>
    );
  }

  const carbonValue = result.chemical_analysis.total_carbon_index;
  const nitrogenValue = result.chemical_analysis.total_nitrogen_index;
  const targetCarbon = nitrogenValue * 30;
  const isBalanced = nitrogenValue > 0 && carbonValue === targetCarbon;
  const isCarbonHigher = carbonValue > targetCarbon;
  const isCarbonHigherRaw = carbonValue > nitrogenValue;
  const message = isBalanced
    ? "Komposisi seimbang (30:1)"
    : isCarbonHigher
      ? "Terlalu banyak karbon"
      : "Terlalu banyak nitrogen";

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
              source={{ uri: image as string }}
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
                color={
                  isBalanced
                    ? "#166534"
                    : isCarbonHigherRaw
                      ? "#991b1b"
                      : "#166534"
                }
              />
              <Text className="text-center text-gray-500">
                Karbon(C) {carbonValue}%
              </Text>
            </View>
            <View className="flex-row items-center justify-center gap-2">
              <FontAwesome
                name="circle"
                size={16}
                color={
                  isBalanced
                    ? "#166534"
                    : isCarbonHigherRaw
                      ? "#166534"
                      : "#991b1b"
                }
              />
              <Text className="text-center text-gray-500">
                Nitrogen(N) {nitrogenValue}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Rekomendasi Tindakan */}
        {!isBalanced && (
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
                  {result.expert_advice.additive_suggestion.map(
                    (item, index) => (
                      <View
                        key={`${item}-${index}`}
                        className="flex-row items-center gap-4 px-4 py-2 bg-white rounded-xl border border-gray-300"
                      >
                        <View className="items-center justify-center">
                          <AntDesign
                            name="plus-circle"
                            size={18}
                            color="black"
                          />
                        </View>
                        <Text className="text-gray-700 flex-1">
                          Tambahkan{" "}
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}
          </View>
        )}

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
        </View>
      </View>
    </ScreenWrapper>
  );
}
