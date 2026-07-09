import CompositionText from "@/components/composition";
import PageHeader from "@/components/PageHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { appendScanToBatch, getOrCreateActiveBatch } from "@/services/activeBatch";
import { syncNow } from "@/services/syncService";
import {
  AntDesign,
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
  detectedItems: string[];
  organicCount: number;
  inorganicCount: number;
  organicPercent: number;
  inorganicPercent: number;
  summary: string;
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
  const organicValue = result.organicPercent;
  const inorganicValue = result.inorganicPercent;
  const totalDetected = result.organicCount + result.inorganicCount;
  const hasInorganic = result.inorganicCount > 0;
  const allItems = result.detectedItems;
  const guidance = hasInorganic
    ? {
        headline: "Pisahkan objek anorganik sebelum dikomposkan.",
        actions: [
          "Keluarkan plastik, logam, atau kaca dari tumpukan.",
          "Komposkan hanya bahan organik yang tersisa.",
        ],
      }
    : totalDetected > 0
      ? {
          headline: "Semua objek terdeteksi organik — siap dikomposkan.",
          actions: [
            "Cacah bahan agar lebih cepat terurai.",
            "Jaga kelembapan dan lakukan aerasi berkala.",
          ],
        }
      : {
          headline: "Belum ada objek terdeteksi.",
          actions: [
            "Arahkan kamera lebih dekat ke sampah lalu ambil foto lagi.",
          ],
        };

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
            Objek Terdeteksi
          </Text>
          <View className="mt-4 gap-2">
            {allItems.length === 0 && (
              <View className="flex-row items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
                <MaterialCommunityIcons name="leaf" size={18} color="#166534" />
                <Text className="font-semibold flex-1">
                  Belum ada objek terdeteksi
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

        {/* Tab Komposisi Organik vs Anorganik */}
        <View className="flex bg-white px-6 py-8 rounded-xl shadow-md shadow-gray-200">
          <Text className="text-2xl text-center font-semibold">
            Komposisi Organik vs Anorganik
          </Text>
          <CompositionText
            carbon={organicValue}
            nitrogen={inorganicValue}
            leftLabel="ORGANIK"
            rightLabel="ANORGANIK"
          />
          <View className="items-center justify-center">
            <View
              className={`px-4 py-3 rounded-full flex-row items-center justify-center ${
                hasInorganic ? "bg-red-100" : "bg-green-100"
              }`}
            >
              <Ionicons
                name={
                  hasInorganic ? "warning-outline" : "checkmark-circle-outline"
                }
                size={18}
                color={hasInorganic ? "#991b1b" : "#166534"}
              />
              <Text
                className={`font-semibold ml-2 ${
                  hasInorganic ? "text-red-800" : "text-green-800"
                }`}
              >
                {totalDetected > 0
                  ? hasInorganic
                    ? "Ada objek anorganik"
                    : "Semua organik"
                  : "Belum ada deteksi"}
              </Text>
            </View>
          </View>
          <View className="border-t border-gray-400 w-full flex my-8" />
          <View className="flex-row items-center justify-center gap-6">
            <View className="flex-row items-center justify-center gap-2">
              <FontAwesome name="circle" size={16} color="#166534" />
              <Text className="text-center text-gray-500">
                Organik {organicValue}%
              </Text>
            </View>
            <View className="flex-row items-center justify-center gap-2">
              <FontAwesome name="circle" size={16} color="#991b1b" />
              <Text className="text-center text-gray-500">
                Anorganik {inorganicValue}%
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
                {guidance.headline}
              </Text>
              <View className="gap-2">
                {guidance.actions.map((item, index) => (
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

        <View className="flex bg-white px-6 py-8 rounded-xl my-8 mt-8 shadow-md shadow-gray-200">
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
                // Append this scan to the device's active batch instead of
                // minting a new batch per scan — keeps one ongoing process
                // per device, matching the multi-device sync model.
                const batch = await getOrCreateActiveBatch();
                await appendScanToBatch(batch, {
                  imageUri: result.imageUri,
                  organicCount: result.organicCount,
                  inorganicCount: result.inorganicCount,
                  organicPercent: organicValue,
                  inorganicPercent: inorganicValue,
                  detectedItems: allItems,
                  summary: guidance.headline,
                  aiInstruction: result.summary ?? "",
                });

                // Push to backend now; resilient to being offline (no-op).
                syncNow().catch(() => {});

                Alert.alert("Berhasil", "Progress berhasil disimpan.", [
                  {
                    text: "Lihat Progress",
                    onPress: () => router.replace("/(tabs)/progress"),
                  },
                  { text: "OK", style: "cancel" },
                ]);
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
