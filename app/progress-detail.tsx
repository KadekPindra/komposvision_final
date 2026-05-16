import PageHeader from "@/components/PageHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { database } from "@/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Q } from "@nozbe/watermelondb";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type CompostItem = {
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

const mapCompostItem = (item: any, activities: any[]): CompostItem => ({
  id: item.id,
  image: item.imageUri ?? "",
  date: item.lastUpdatedFormatted ?? "",
  ratio: item.ratio ?? "-",
  title: item.title ?? "Kompos",
  status: item.status ?? "Aktif",
  progress: typeof item.progress === "number" ? item.progress : 0,
  summary: item.summary ?? "",
  temperatureC: typeof item.temperatureC === "number" ? item.temperatureC : 0,
  moisture: item.moisture ?? "Sedang",
  nextAction: item.nextAction ?? "",
  etaDays: typeof item.etaDays === "number" ? item.etaDays : 0,
  composition: Array.isArray(item.composition) ? item.composition : [],
  activities: activities.map((activity) => ({
    title: activity.title,
    time: activity.timeLabel,
    description: activity.description,
    isActive: activity.isActive,
  })),
});

// Hardcoded system recommendation engine for manual progress updates.
// Picks a next-action suggestion based on keywords in what the user reports.
const pickManualRecommendation = (
  title: string,
  description: string,
  material: string,
): string => {
  const text = `${title} ${description} ${material}`.toLowerCase();
  if (/(siram|air|basah|lembap|lembab)/.test(text)) {
    return "Tutup tumpukan dengan daun kering tipis dan aduk untuk aerasi agar tidak terlalu basah.";
  }
  if (/(aduk|balik|aerasi|putar)/.test(text)) {
    return "Cek suhu dan kelembapan 2-3 hari ke depan; ulangi aerasi bila bagian dalam masih panas.";
  }
  if (/(sayur|buah|kulit|sisa makan|rumput|hijau|nitrogen)/.test(text)) {
    return "Tambahkan bahan coklat (daun kering atau kardus) untuk seimbangkan rasio C/N.";
  }
  if (/(daun|kardus|kayu|kering|coklat|karton|serbuk|karbon)/.test(text)) {
    return "Tambahkan sedikit bahan hijau atau siram tipis bila tumpukan terasa kering.";
  }
  if (/(panen|matang|jadi|selesai|siap)/.test(text)) {
    return "Saring kompos yang sudah matang; sisihkan bagian kasar untuk siklus berikutnya.";
  }
  if (/(bau|bau busuk|amoniak)/.test(text)) {
    return "Tambahkan bahan coklat dan tingkatkan aerasi untuk kurangi bau.";
  }
  return "Pantau suhu dan kelembapan; lakukan aerasi rutin 2-3 hari ke depan.";
};

const formatActivityTime = (rawTime: string | undefined): string => {
  if (!rawTime) return "";
  const s = rawTime.trim();
  const lower = s.toLowerCase();
  if (lower === "hari ini" || lower === "baru saja" || lower === "kemarin") {
    return s;
  }
  const parts = s.split(",");
  if (parts.length < 2) return s;
  const datePart = parts[0].trim(); // "12 Okt 2023"
  const timePart = parts[1].trim(); // "08:30"
  const dp = datePart.split(" ");
  if (dp.length < 3) return s;
  const day = parseInt(dp[0], 10);
  const monthLabel = dp[1];
  const year = parseInt(dp[2], 10);
  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    Mei: 4,
    Jun: 5,
    Jul: 6,
    Agu: 7,
    Sep: 8,
    Okt: 9,
    Nov: 10,
    Des: 11,
  };
  const monthIdx = monthMap[monthLabel] ?? NaN;
  if (Number.isNaN(day) || Number.isNaN(year) || Number.isNaN(monthIdx))
    return s;
  const d = new Date(year, monthIdx, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (isSameDate(d, today)) {
    return `Hari ini, ${timePart}`;
  }
  if (isSameDate(d, yesterday)) {
    return `Kemarin, ${timePart}`;
  }
  return datePart; // fallback to original date text
};

type ProgressBarProps = {
  progress: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const getBarColor = (value: number) => {
    if (value < 30) return "bg-amber-700";
    if (value < 70) return "bg-green-500";
    return "bg-green-700";
  };

  return (
    <View className="mt-2">
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-xs text-gray-500 font-medium">Progress</Text>
        <Text className="text-xs text-gray-700 font-semibold">{progress}%</Text>
      </View>
      <View className="h-2 bg-orange-100 rounded-full overflow-hidden">
        <View
          className={`h-full ${getBarColor(progress)} rounded-full`}
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
};

type TimelineDotProps = {
  isActive: boolean;
  isLast?: boolean;
};

const TimelineDot: React.FC<TimelineDotProps> = ({ isActive, isLast }) => (
  <View className="items-center mr-4">
    <View
      className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`}
    />
    {isLast ? null : <View className="w-0.5 flex-1 bg-gray-200 my-1" />}
  </View>
);

const DetailProgressScreen = () => {
  const { id } = useLocalSearchParams();
  const itemId = useMemo(() => String(id ?? ""), [id]);
  const [item, setItem] = useState<CompostItem | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customDelta, setCustomDelta] = useState("0");
  const [materialName, setMaterialName] = useState("");
  const [materialCondition, setMaterialCondition] = useState("");
  const [materialGrams, setMaterialGrams] = useState("");
  const [isCompositionOpen, setIsCompositionOpen] = useState(false);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const batch = await database.get("compost_batches").find(itemId);
      const activityRecords = await database
        .get("compost_activities")
        .query(Q.where("batch_id", itemId), Q.sortBy("created_at", Q.desc))
        .fetch();
      setItem(mapCompostItem(batch, activityRecords));
      setErrorMessage(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const header = (
    <PageHeader title="Detail Progress" onBack={() => router.back()} />
  );

  if (loading) {
    return (
      <ScreenWrapper header={header}>
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-gray-500">Memuat detail...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (errorMessage) {
    return (
      <ScreenWrapper header={header}>
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-gray-500">{errorMessage}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!item) {
    return (
      <ScreenWrapper header={header}>
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-gray-500">Data kompos tidak ditemukan.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const quickUpdates = [
    {
      key: "add-green",
      title: "Tambah bahan hijau",
      delta: 6,
      status: "Sedang Terurai",
      activity: {
        title: "Tambah bahan hijau",
        time: "Baru saja",
        description: "Menambahkan sisa sayur dan kulit buah.",
        isActive: true,
      },
      nextAction: "Tambahkan bahan coklat agar rasio tetap seimbang.",
    },
    {
      key: "turning",
      title: "Aduk kompos",
      delta: 4,
      status: "Aktif",
      activity: {
        title: "Aduk kompos",
        time: "Baru saja",
        description: "Aerasi dilakukan untuk meningkatkan oksigen.",
        isActive: true,
      },
      nextAction: "Cek kelembapan dalam 2-3 hari.",
    },
    {
      key: "drying",
      title: "Kurangi kelembapan",
      delta: 3,
      status: "Sedang Terurai",
      activity: {
        title: "Kurangi kelembapan",
        time: "Baru saja",
        description: "Menambahkan daun kering tipis.",
        isActive: true,
      },
      nextAction: "Pantau suhu dan bau.",
    },
  ];

  const handleQuickUpdate = async (update: (typeof quickUpdates)[number]) => {
    if (!item) return;
    setIsUpdating(true);
    setIsUpdateOpen(false);
    try {
      await database.write(async () => {
        const batch = (await database
          .get("compost_batches")
          .find(item.id)) as any;
        const nextProgress = Math.max(
          0,
          Math.min(100, batch.progress + update.delta),
        );
        await batch.update((record: any) => {
          record.progress = nextProgress;
          record.status = update.status;
          record.nextAction = update.nextAction;
          record.lastUpdatedFormatted = new Date().toLocaleString("id-ID");
        });

        await database.get("compost_activities").create((record: any) => {
          record.batchId = item.id;
          record.title = update.activity.title;
          record.description = update.activity.description;
          record.isActive = true;
          record.timeLabel = update.activity.time;
          record.createdAt = Date.now();
        });
      });

      await fetchDetail();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      Alert.alert("Error", message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCustomUpdate = async () => {
    if (!item) return;
    const deltaValue = Number(customDelta);
    const materialNameValue = materialName.trim();
    const gramsValue = Number(materialGrams);
    const conditionValue = materialCondition.trim() || "basah";
    const shouldRecalculate =
      materialNameValue.length > 0 &&
      Number.isFinite(gramsValue) &&
      gramsValue > 0;
    const defaultTitle = shouldRecalculate
      ? `Tambah ${materialNameValue}`
      : "Update manual";
    const baseDesc =
      customDesc.trim() ||
      (shouldRecalculate
        ? "Update bahan kompos."
        : "Update progress ditambahkan.");
    const materialInfo = shouldRecalculate
      ? `Bahan: ${materialNameValue} (${conditionValue}, ${gramsValue} g)`
      : "";
    const activityTitle = customTitle.trim() || defaultTitle;
    const activityDesc = materialInfo
      ? `${baseDesc}\n${materialInfo}`
      : baseDesc;

    if (
      materialNameValue &&
      (!Number.isFinite(gramsValue) || gramsValue <= 0)
    ) {
      Alert.alert("Error", "Berat bahan harus berupa angka (gram) yang valid.");
      return;
    }

    const systemRecommendation = pickManualRecommendation(
      activityTitle,
      baseDesc,
      materialNameValue,
    );

    setIsUpdating(true);
    setIsUpdateOpen(false);
    try {
      await database.write(async () => {
        const batch = (await database
          .get("compost_batches")
          .find(item.id)) as any;
        const progressDelta = Number.isFinite(deltaValue) ? deltaValue : 0;
        const nextProgress = Math.max(
          0,
          Math.min(100, batch.progress + progressDelta),
        );
        await batch.update((record: any) => {
          record.progress = nextProgress;
          record.nextAction = systemRecommendation;
          record.lastUpdatedFormatted = new Date().toLocaleString("id-ID");
        });

        await database.get("compost_activities").create((record: any) => {
          record.batchId = item.id;
          record.title = activityTitle;
          record.description = activityDesc;
          record.isActive = true;
          record.timeLabel = "Baru saja";
          record.createdAt = Date.now();
        });
      });

      await fetchDetail();
      Alert.alert(
        "Update tersimpan",
        `Rekomendasi sistem:\n\n${systemRecommendation}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      Alert.alert("Error", message);
    } finally {
      setIsUpdating(false);
    }

    setCustomTitle("");
    setCustomDesc("");
    setCustomDelta("0");
    setMaterialName("");
    setMaterialCondition("");
    setMaterialGrams("");
  };

  return (
    <ScreenWrapper header={header}>
      <View className="flex-1 pb-10">
        <View className="mt-2 rounded-2xl overflow-hidden relative h-64">
          <Image
            source={{ uri: item.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/45" />

          <View className="absolute bottom-6 left-6 right-6">
            <View className="bg-green-500/90 px-3 py-1 rounded-full self-start mb-2">
              <Text className="text-white text-xs font-semibold">
                {item.status}
              </Text>
            </View>

            <View className="flex-row items-end">
              <View>
                <Text className="text-white text-3xl font-bold">
                  {item.title}
                </Text>
                <View className="flex-row items-start gap-4">
                  <MaterialCommunityIcons
                    name="calendar"
                    size={16}
                    color="white"
                  />
                  <Text className="text-white text-sm font-medium">
                    {item.date}
                  </Text>
                </View>
              </View>
              <View className=""></View>
            </View>
          </View>
        </View>

        <View className="flex-row mt-4 gap-3">
          <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm border border-gray-100">
            <View className="w-14 h-14 bg-green-100 rounded-full items-center justify-center">
              <MaterialCommunityIcons name="leaf" size={22} color="#16a34a" />
            </View>
            <Text className="text-xs text-gray-500 mt-3 mb-1">Rasio C/N</Text>
            {isUpdating ? (
              <View className="h-6 w-16 bg-gray-200 rounded-full" />
            ) : (
              <Text className="text-lg font-bold text-gray-900">
                {item.ratio}
              </Text>
            )}
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 items-center shadow-sm border border-gray-100">
            <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center">
              <MaterialCommunityIcons
                name="timer-sand"
                size={22}
                color="#4b5563"
              />
            </View>
            <Text className="text-xs text-gray-500 mt-3 mb-1">
              Estimasi Panen
            </Text>
            {isUpdating ? (
              <View className="h-6 w-20 bg-gray-200 rounded-full" />
            ) : (
              <Text className="text-lg font-bold text-gray-900">
                {item.etaDays} hari
              </Text>
            )}
          </View>
        </View>

        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Komposisi Bahan
            </Text>
            {item.composition.length > 2 && (
              <TouchableOpacity
                onPress={() => setIsCompositionOpen((prev) => !prev)}
                className="flex-row items-center"
              >
                <Text className="text-xs text-gray-500 mr-1">
                  {isCompositionOpen ? "Tutup" : "Lihat Semua"}
                </Text>
                <MaterialCommunityIcons
                  name={isCompositionOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            )}
          </View>

          {(isCompositionOpen
            ? item.composition
            : item.composition.slice(0, 2)
          ).map((composition) => {
            const isGreen = composition.tone === "green";
            const labelColor = isGreen ? "text-green-600" : "text-amber-700";
            const iconBg = isGreen ? "bg-green-100" : "bg-amber-100";
            const barColor = isGreen ? "bg-green-500" : "bg-amber-400";
            const icon = isGreen ? "recycle" : "leaf";

            return (
              <View
                key={composition.label}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-10 h-10 ${iconBg} rounded-full items-center justify-center mr-3`}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={18}
                        color={isGreen ? "#16a34a" : "#b45309"}
                      />
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-gray-900">
                        {composition.label}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {composition.detail}
                      </Text>
                    </View>
                  </View>
                  <Text className={`text-lg font-bold ${labelColor}`}>
                    {composition.percent}%
                  </Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full ${barColor} rounded-full`}
                    style={{ width: `${composition.percent}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Riwayat Aktivitas
            </Text>
            {item.activities.length > 2 && (
              <TouchableOpacity
                onPress={() => setIsActivitiesOpen((prev) => !prev)}
                className="flex-row items-center"
              >
                <Text className="text-xs text-gray-500 mr-1">
                  {isActivitiesOpen ? "Tutup" : "Lihat Semua"}
                </Text>
                <MaterialCommunityIcons
                  name={isActivitiesOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            )}
          </View>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {(isActivitiesOpen
              ? item.activities
              : item.activities.slice(0, 2)
            ).map((activity, index, list) => (
              <View key={`${activity.title}-${index}`} className="flex-row">
                <TimelineDot
                  isActive={activity.isActive}
                  isLast={index === list.length - 1}
                />
                <View className="flex-1 pb-4">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {activity.title}
                    </Text>
                    <View className="bg-gray-100 px-2 py-1 rounded-md">
                      <Text className="text-xs text-gray-600 font-medium">
                        {formatActivityTime(activity.time)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-500 leading-relaxed">
                    {activity.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="mt-6">
          <View className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-900">Ringkasan</Text>
            <Text className="text-gray-600 mt-2">{item.summary}</Text>
            <View className="border-t border-gray-100 my-4" />
            <Text className="text-sm text-gray-500">Suhu</Text>
            <Text className="text-lg font-semibold text-gray-900">
              {item.temperatureC} C
            </Text>
            <Text className="text-sm text-gray-500 mt-3">Kelembapan</Text>
            <Text className="text-lg font-semibold text-gray-900">
              {item.moisture}
            </Text>
            <ProgressBar progress={item.progress} />
          </View>
        </View>

        <View className="mt-6">
          <View className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-900">
              Aksi Berikutnya
            </Text>
            <Text className="text-gray-600 mt-2">{item.nextAction}</Text>
            <View className="mt-3 bg-green-50 px-3 py-2 rounded-full self-start">
              <Text className="text-xs text-green-700 font-semibold">
                Estimasi matang: {item.etaDays} hari
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-6">
          <TouchableOpacity
            onPress={() => setIsUpdateOpen(true)}
            className="bg-green-600 rounded-full py-4 items-center flex-row justify-center shadow-md shadow-green-600/20"
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={20}
              color="white"
            />
            <Text className="text-white font-semibold text-base ml-2">
              Update Status / Tambah Bahan
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isUpdateOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsUpdateOpen(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-5 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">
                Update Progress
              </Text>
              <TouchableOpacity onPress={() => setIsUpdateOpen(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {quickUpdates.map((update) => (
                <TouchableOpacity
                  key={update.key}
                  onPress={() => handleQuickUpdate(update)}
                  disabled={isUpdating}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                  style={{ opacity: isUpdating ? 0.6 : 1 }}
                >
                  <Text className="text-sm font-semibold text-gray-900">
                    {update.title}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    +{update.delta}% progres
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="mt-5 border-t border-gray-200 pt-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                Update Manual
              </Text>
              <View className="gap-3">
                <TextInput
                  value={customTitle}
                  onChangeText={setCustomTitle}
                  placeholder="Judul aktivitas"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                />
                <TextInput
                  value={customDesc}
                  onChangeText={setCustomDesc}
                  placeholder="Deskripsi singkat"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                />
                <TextInput
                  value={customDelta}
                  onChangeText={setCustomDelta}
                  placeholder="Tambah progres (contoh: 5)"
                  keyboardType="numeric"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                />
                <View className="mt-2">
                  <Text className="text-xs text-gray-500 mb-2">
                    (Opsional) Tambahkan bahan untuk hitung ulang rasio
                  </Text>
                  <TextInput
                    value={materialName}
                    onChangeText={setMaterialName}
                    placeholder="Nama bahan (contoh: kulit jeruk)"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
                  />
                  <TextInput
                    value={materialCondition}
                    onChangeText={setMaterialCondition}
                    placeholder="Kondisi (basah/kering)"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm mt-2"
                  />
                  <TextInput
                    value={materialGrams}
                    onChangeText={setMaterialGrams}
                    placeholder="Berat (gram)"
                    keyboardType="numeric"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm mt-2"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleCustomUpdate}
                  disabled={isUpdating}
                  className="bg-green-600 rounded-xl py-3 items-center"
                  style={{ opacity: isUpdating ? 0.7 : 1 }}
                >
                  <Text className="text-white font-semibold">
                    {isUpdating ? "Menyimpan..." : "Simpan Update"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default DetailProgressScreen;
