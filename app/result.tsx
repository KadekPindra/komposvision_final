import CompositionText from "@/components/composition";
import PageHeader from "@/components/PageHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { database } from "@/database";
import { generateCompostAdvice } from "@/utils/compostAdvisor";
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
  contaminants: {
    classId: number;
    className: string;
    confidence: number;
    bbox: [number, number, number, number];
  }[];
  aiInstruction: string;
};

export default function ResultScreen() {
  const { data, image } = useLocalSearchParams();
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4 / 3);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isAdviceExpanded, setIsAdviceExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

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
      if (parsed?.imageUri) {
        setResult(parsed);
      } else {
        console.log("[Result] unsupported scan result shape", { parsed });
      }
    } catch (error) {
      console.log("[Result] failed to parse scan result", { error });
    }
  }, [data]);

  useEffect(() => {
    const imageUrl = result?.imageUri ?? (image as string | undefined);
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

  const imageUrl = result.imageUri;
  const carbonEntry = result.composition.find((item) => item.tone === "brown");
  const nitrogenEntry = result.composition.find(
    (item) => item.tone === "green",
  );
  const carbonValue = carbonEntry?.percent ?? 50;
  const nitrogenValue = nitrogenEntry?.percent ?? 50;
  const ratioParsed = Number(result.estimatedRatio.split(":")[0]);
  const ratioValue = Number.isFinite(ratioParsed) ? ratioParsed : 0;
  const isBalanced = ratioValue >= 20 && ratioValue <= 30;
  const message = isBalanced ? "Komposisi seimbang" : result.aiInstruction;
  const allItems = [...result.carbonItems, ...result.nitrogenItems];
  const advice = generateCompostAdvice({
    ratio: result.estimatedRatio || "25:1",
    carbonPercent: carbonValue,
    nitrogenPercent: nitrogenValue,
    batchAgeDays: 3,
    temperatureC: 35,
    moisture: "Sedang",
  });
  const suggestions = isBalanced
    ? ["Pertahankan rasio saat ini"]
    : ratioValue > 30
      ? ["Tambah bahan hijau (sayur, rumput)"]
      : ["Tambah bahan coklat (daun kering, kardus)"];
  const estimatedYieldKg = Math.max(1, Math.round(allItems.length / 2));

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
            {allItems.length === 0 && (
              <View className="flex-row items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                <MaterialCommunityIcons name="leaf" size={18} color="#166534" />
                <Text className="font-semibold flex-1">
                  Belum ada bahan terdeteksi
                </Text>
              </View>
            )}
            {allItems.map((item, index) => (
              <View
                key={`${item}-${index}`}
                className="flex-row items-center gap-3 border border-gray-200 rounded-lg px-4 py-3"
              >
                <MaterialCommunityIcons
                  name={getItemIcon(item).icon as never}
                  size={18}
                  color={getItemIcon(item).color}
                />
                <Text className="font-semibold flex-1">
                  {item.charAt(0).toUpperCase() + item.slice(1)}
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
              {/* <Text
                className={`font-semibold ml-2 ${
                  isBalanced ? "text-green-800" : "text-red-800"
                }`}
              >
                {message}
              </Text> */}
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
                {advice.nextAction}
              </Text>
              <View className="gap-2">
                {suggestions.map((item, index) => (
                  <View
                    key={`${item}-${index}`}
                    className="flex-row items-center gap-4 px-4 py-2 bg-white rounded-xl border border-gray-300"
                  >
                    <View className="items-center justify-center">
                      <AntDesign name="plus-circle" size={18} color="black" />
                    </View>
                    <Text className="text-gray-700 flex-1">{item}</Text>
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
                ~ {estimatedYieldKg}kg
              </Text>
            </View>
            <View className="flex-1 items-center justify-center border border-gray-200 rounded-lg px-4 py-3">
              <Entypo name="calendar" size={24} color="#166534" />
              <Text className="font-semibold mt-1 text-gray-600">
                Waktu Matang
              </Text>
              <Text className="mt-2 font-bold text-2xl">
                ~ {advice.etaDays} hari
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
              setSaving(true);
              try {
                await database.write(async () => {
                  const profiles = await database
                    .get("profiles")
                    .query()
                    .fetch();
                  let profileId = profiles[0]?.id;
                  if (!profileId) {
                    const profile = await database
                      .get("profiles")
                      .create((record: any) => {
                        record.fullName = "Pengguna Offline";
                        record.totalCompostKg = 0;
                        record.createdAt = new Date().toISOString();
                      });
                    profileId = profile.id;
                  }

                  const batch = await database
                    .get("compost_batches")
                    .create((record: any) => {
                      record.userId = profileId;
                      record.title = allItems[0] ?? "Hasil Scan";
                      record.status = "Tersimpan";
                      record.imageUri = result.imageUri;
                      record.ratio = result.estimatedRatio || "-";
                      record.progress = 10;
                      record.summary = advice.summary;
                      record.temperatureC = 35;
                      record.moisture = "Sedang";
                      record.nextAction = advice.nextAction;
                      record.etaDays = advice.etaDays;
                      record.composition = result.composition;
                      record.lastUpdatedFormatted = new Date().toLocaleString(
                        "id-ID",
                      );
                    });

                  await database.get("scans").create((record: any) => {
                    record.userId = profileId;
                    record.batchId = batch.id;
                    record.imageUri = result.imageUri;
                    record.carbonItems = result.carbonItems;
                    record.nitrogenItems = result.nitrogenItems;
                    record.estimatedRatio = result.estimatedRatio;
                    record.aiInstruction = result.aiInstruction;
                    record.createdAt = new Date().toISOString();
                  });

                  await database
                    .get("compost_activities")
                    .create((record: any) => {
                      record.batchId = batch.id;
                      record.title = "Hasil scan disimpan";
                      record.description =
                        "Hasil analisis ditambahkan dari halaman result.";
                      record.isActive = true;
                      record.timeLabel = new Date().toLocaleString("id-ID");
                      record.createdAt = new Date().toISOString();
                    });
                });

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
