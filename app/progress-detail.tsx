import PageHeader from "@/components/PageHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

type CompostItemResponse = {
  id: string;
  image_url?: string | null;
  date: string;
  current_ratio: string;
  name: string;
  status: string;
  progress: number;
  summary?: string | null;
  temperature_c: number;
  moisture: "Rendah" | "Sedang" | "Tinggi";
  next_action?: string | null;
  eta_days: number;
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
    is_active: boolean;
  }[];
};

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

const DEV_USER_ID = "0f76a64a-d37e-4f69-af95-f32002ec1390";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const mapCompostItem = (item: CompostItemResponse): CompostItem => ({
  id: item.id,
  image: item.image_url ?? "",
  date: item.date,
  ratio: item.current_ratio,
  title: item.name,
  status: item.status,
  progress: item.progress,
  summary: item.summary ?? "",
  temperatureC: item.temperature_c,
  moisture: item.moisture,
  nextAction: item.next_action ?? "",
  etaDays: item.eta_days,
  composition: item.composition,
  activities: item.activities.map((activity) => ({
    title: activity.title,
    time: activity.time,
    description: activity.description,
    isActive: activity.is_active,
  })),
});

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
      className={`w-3 h-3 rounded-full ${
        isActive ? "bg-green-500" : "bg-gray-300"
      }`}
    />
    {isLast ? null : <View className="w-0.5 flex-1 bg-gray-200 my-1" />}
  </View>
);

const DetailProgressScreen = () => {
  const { id } = useLocalSearchParams();
  const itemId = useMemo(() => String(id ?? ""), [id]);
  const [item, setItem] = useState<CompostItem | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customDelta, setCustomDelta] = useState("0");

  const fetchDetail = useCallback(async () => {
    if (!API_BASE_URL || !itemId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/progress/${itemId}?user_id=${DEV_USER_ID}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as CompostItemResponse;
      setItem(mapCompostItem(data));
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
    if (!API_BASE_URL || !item) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/progress/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: DEV_USER_ID,
          progressDelta: update.delta,
          status: update.status,
          nextAction: update.nextAction,
          activity: {
            title: update.activity.title,
            time: update.activity.time,
            description: update.activity.description,
            isActive: update.activity.isActive,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Gagal memperbarui progress");
      }

      await fetchDetail();
      setIsUpdateOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      Alert.alert("Error", message);
    }
  };

  const handleCustomUpdate = async () => {
    if (!API_BASE_URL || !item) return;
    const deltaValue = Number(customDelta);
    const activityTitle = customTitle.trim() || "Update manual";
    const activityDesc = customDesc.trim() || "Update progress ditambahkan.";

    try {
      const response = await fetch(`${API_BASE_URL}/api/progress/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: DEV_USER_ID,
          progressDelta: Number.isFinite(deltaValue) ? deltaValue : 0,
          activity: {
            title: activityTitle,
            time: "Baru saja",
            description: activityDesc,
            isActive: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Gagal memperbarui progress");
      }

      await fetchDetail();
      setIsUpdateOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      Alert.alert("Error", message);
    }

    setCustomTitle("");
    setCustomDesc("");
    setCustomDelta("0");
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
            <Text className="text-lg font-bold text-gray-900">
              {item.ratio}
            </Text>
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
            <Text className="text-lg font-bold text-gray-900">
              {item.etaDays} hari
            </Text>
          </View>
        </View>

        <View className="mt-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Komposisi Bahan
          </Text>

          {item.composition.map((composition) => {
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
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Riwayat Aktivitas
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {item.activities.map((activity, index) => (
              <View key={`${activity.title}-${index}`} className="flex-row">
                <TimelineDot
                  isActive={activity.isActive}
                  isLast={index === item.activities.length - 1}
                />
                <View className="flex-1 pb-4">
                  <View className="flex-row justify-between items-start mb-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {activity.title}
                    </Text>
                    <View className="bg-gray-100 px-2 py-1 rounded-md">
                      <Text className="text-xs text-gray-600 font-medium">
                        {activity.time}
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
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
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
                <TouchableOpacity
                  onPress={handleCustomUpdate}
                  className="bg-green-600 rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-semibold">
                    Simpan Update
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
