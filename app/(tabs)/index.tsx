import AppHeader from "@/components/AppHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import {
  getCompostProgress,
  subscribeCompostProgress,
} from "@/services/compostProgressStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const [items, setItems] = useState(getCompostProgress());

  useEffect(() => {
    return subscribeCompostProgress(() => {
      setItems(getCompostProgress());
    });
  }, []);

  const summary = useMemo(() => {
    const total = items.length;
    const totalProgress = items.reduce((acc, item) => acc + item.progress, 0);
    const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;
    const activeCount = items.filter((item) => item.progress < 100).length;
    const topItem = items.reduce(
      (best, item) => (item.progress > best.progress ? item : best),
      items[0],
    );
    const latestActivity = items[0]?.activities?.[0];
    const latestScan = items[0];
    const progressBuckets = items
      .slice(0, 6)
      .map((item) => Math.max(10, Math.min(100, item.progress)));
    const chartData =
      progressBuckets.length > 0 ? progressBuckets : [25, 35, 45, 55, 65, 75];

    return {
      total,
      averageProgress,
      activeCount,
      topItem,
      latestActivity,
      latestScan,
      chartData,
    };
  }, [items]);

  const progressLabel =
    summary.averageProgress >= 70
      ? "Stabil"
      : summary.averageProgress >= 40
        ? "Berkembang"
        : "Perlu Perhatian";

  const progressColor =
    summary.averageProgress >= 70
      ? "text-green-600"
      : summary.averageProgress >= 40
        ? "text-amber-600"
        : "text-red-600";

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1">
        {/* HEADER */}
        <AppHeader
          rightSlot={
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              className="w-10 h-10 rounded-full"
            />
          }
        />

        {/* GREETING */}
        <View>
          <Text className="text-2xl font-bold text-gray-800">
            Halo, Petualang Hijau!
          </Text>
          <Text className="text-gray-500 mt-1">
            Mari lihat perkembangan komposmu hari ini.
          </Text>
        </View>

        {/* KESEHATAN KOMPOS */}
        <View className="bg-gray-100 rounded-2xl p-4 mt-4">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-gray-700">
              Ringkasan Progress
            </Text>

            <Ionicons name="checkmark-circle" size={20} color="green" />
          </View>

          <View className="mt-2 flex-row items-center">
            <View className="bg-green-100 px-2 py-1 rounded-full">
              <Text className={`text-xs font-semibold ${progressColor}`}>
                {progressLabel}
              </Text>
            </View>

            <Text className="ml-auto text-gray-500 text-sm">
              {summary.averageProgress}%
            </Text>
          </View>

          {/* PROGRESS BAR */}
          <View className="h-2 bg-gray-200 rounded-full mt-3">
            <View
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${summary.averageProgress}%` }}
            />
          </View>

          <Text className="text-gray-400 text-xs mt-2">
            Rata-rata progres dari {summary.total} tumpukan
          </Text>
        </View>

        {/* STATS */}
        <View className="flex-row justify-between mt-4">
          {/* CARD 1 */}
          <View className="bg-gray-100 rounded-2xl p-4 w-[48%]">
            <MaterialIcons name="recycling" size={20} color="green" />
            <Text className="text-xl font-bold mt-2">
              {summary.activeCount}
            </Text>
            <Text className="text-gray-500 text-sm">Tumpukan Aktif</Text>
          </View>

          {/* CARD 2 */}
          <View className="bg-gray-100 rounded-2xl p-4 w-[48%]">
            <Ionicons name="leaf" size={20} color="green" />
            <Text className="text-xl font-bold mt-2">
              {summary.averageProgress}%
            </Text>
            <Text className="text-gray-500 text-sm">Rata-rata Progres</Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View className="bg-white border border-gray-100 rounded-2xl p-4 mt-4 shadow-sm">
          <Text className="font-semibold text-gray-700">Aksi Cepat</Text>
          <View className="flex-row mt-3 gap-3">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-2">
                Analisis Terakhir
              </Text>
              <View className="bg-gray-100 rounded-xl p-3">
                <Text className="text-sm font-semibold text-gray-900">
                  {summary.latestScan?.title ?? "Belum ada"}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {summary.latestScan?.date ?? "Mulai dari scan"}
                </Text>
              </View>
            </View>
            <View className="items-end justify-between">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => router.push("/scan")}
                  className="bg-green-600 rounded-full p-3"
                >
                  <Ionicons name="camera" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/progress")}
                  className="bg-gray-100 rounded-full p-3"
                >
                  <Ionicons name="stats-chart" size={18} color="#16a34a" />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  onPress={() => router.push("/scan")}
                  className="bg-gray-100 rounded-full px-3 py-2"
                >
                  <Text className="text-xs text-gray-600">Scan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/progress")}
                  className="bg-gray-100 rounded-full px-3 py-2"
                >
                  <Text className="text-xs text-gray-600">Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => router.push("/scan")}
                className="bg-green-600 rounded-xl py-3 items-center"
              >
                <Text className="text-white text-sm font-semibold">
                  Scan Baru
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => router.push("/progress")}
                className="bg-gray-100 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 text-sm font-semibold">
                  Lihat Progress
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* MINI ANALYTICS */}
        <View className="bg-white border border-gray-100 rounded-2xl p-4 mt-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-gray-700">Tren Progres</Text>
            <Text className="text-xs text-gray-400">6 update terakhir</Text>
          </View>
          <View className="flex-row items-end justify-between mt-4 h-24">
            {summary.chartData.map((value, index) => (
              <View
                key={`chart-${index}`}
                className="bg-green-500 rounded-full w-3"
                style={{ height: `${value}%` }}
              />
            ))}
          </View>
          <View className="flex-row justify-between mt-3">
            <Text className="text-xs text-gray-400">Mulai</Text>
            <Text className="text-xs text-gray-400">Sekarang</Text>
          </View>
        </View>

        {/* HIGHLIGHT */}
        <View className="bg-white border border-gray-100 rounded-2xl p-4 mt-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-gray-700">
              Progress Terdekat
            </Text>
            <Ionicons name="trending-up" size={18} color="#16a34a" />
          </View>
          {summary.topItem ? (
            <View className="mt-3">
              <Text className="text-lg font-bold text-gray-900">
                {summary.topItem.title}
              </Text>
              <Text className="text-gray-500 text-sm">
                Status: {summary.topItem.status}
              </Text>
              <View className="h-2 bg-gray-100 rounded-full mt-3">
                <View
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${summary.topItem.progress}%` }}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-2">
                {summary.topItem.progress}%
              </Text>
            </View>
          ) : (
            <Text className="text-gray-500 text-sm mt-2">
              Belum ada data progress.
            </Text>
          )}
        </View>

        {/* AKTIVITAS */}
        <View className="mt-5">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-gray-700">
              Aktivitas Terbaru
            </Text>

            <Ionicons name="arrow-forward" size={18} color="gray" />
          </View>

          {summary.latestActivity ? (
            <View className="bg-gray-100 rounded-xl p-3 mt-3 flex-row items-center">
              <Ionicons name="leaf" size={20} color="green" />
              <View className="ml-3">
                <Text className="font-medium">
                  {summary.latestActivity.title}
                </Text>
                <Text className="text-gray-400 text-xs">
                  {summary.latestActivity.time} ·{" "}
                  {summary.latestActivity.description}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-gray-100 rounded-xl p-3 mt-3">
              <Text className="text-gray-500 text-sm">
                Belum ada aktivitas terbaru.
              </Text>
            </View>
          )}
        </View>

        {/* TIPS */}
        <View className="bg-yellow-100 rounded-2xl p-4 mt-5 mb-10">
          <Text className="font-semibold text-yellow-800">Tips Hari Ini</Text>

          <Text className="text-yellow-800 text-sm mt-2">
            Menjaga rasio 50:50 antara bahan hijau dan coklat akan mempercepat
            proses penguraian dan mencegah bau tak sedap.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
