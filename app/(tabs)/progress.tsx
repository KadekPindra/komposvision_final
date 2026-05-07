import AppHeader from "@/components/AppHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { setCompostProgress } from "@/services/compostProgressStore";
import { CompostItem as StoreCompostItem } from "@/services/compostProgress";
import { Image, Text, TouchableOpacity, View } from "react-native";

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

const DEV_USER_ID = "0f76a64a-d37e-4f69-af95-f32002ec1390";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type CompostItem = {
  id: string;
  image: string;
  date: string;
  ratio: string;
  title: string;
  status: string;
  progress: number;
};

const mapCompostItem = (item: CompostItemResponse): StoreCompostItem => ({
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
  activities: item.activities.map(a => ({
    title: a.title,
    time: a.time,
    description: a.description,
    isActive: a.is_active
  }))
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

type CompostCardProps = {
  item: CompostItem;
  onPress?: () => void;
};

const CompostCard: React.FC<CompostCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="mb-4">
      <View className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
        {/* Image */}
        <View className="rounded-xl overflow-hidden mb-3">
          <Image
            source={{ uri: item.image }}
            className="w-full h-40"
            resizeMode="cover"
          />
        </View>

        {/* Date and Ratio */}
        <View className="flex-row justify-between items-center mb-2">
          <View className="bg-gray-100 px-3 py-1 rounded-full">
            <Text className="text-xs text-gray-600 font-medium">
              {item.date}
            </Text>
          </View>
          <View className="flex-row items-center bg-green-50 px-3 py-1 rounded-full">
            <Text className="text-xs text-green-700 font-semibold">
              ⚡ Rasio {item.ratio}
            </Text>
          </View>
        </View>

        {/* Title and Status */}
        <Text className="text-lg font-bold text-gray-900 mb-1">
          {item.title}
        </Text>
        <Text className="text-sm text-gray-500 mb-2">
          Status: {item.status}
        </Text>

        {/* Progress Bar */}
        <ProgressBar progress={item.progress} />
      </View>
    </TouchableOpacity>
  );
};

export default function ProgressScreen() {
  const [items, setItems] = useState<CompostItem[]>([]);

  useEffect(() => {
    let isActive = true;

    const fetchProgress = async () => {
      if (!API_BASE_URL) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/progress/?user_id=${DEV_USER_ID}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as CompostItemResponse[];
        if (isActive) {
          const mappedItems = data.map(mapCompostItem);
          setItems(mappedItems as any);
          setCompostProgress(mappedItems);
        }
      } catch {
        // Ignore fetch errors for now.
      }
    };

    fetchProgress();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <ScreenWrapper>
      <View className="flex-1 pb-28">
        {/* Header */}
        <AppHeader
          rightSlot={
            <Image
              source={{ uri: "https://i.pravatar.cc/100" }}
              className="w-10 h-10 rounded-full"
            />
          }
        />

        {/* Title Section */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Progress Kompos
          </Text>
          <Text className="text-base text-gray-500 leading-relaxed">
            Pantau setiap tahap penguraian dari{"\n"}sampah organikmu.
          </Text>
        </View>

        {/* Compost Cards */}
        {items.map((item) => (
          <CompostCard
            key={item.id}
            item={item}
            onPress={() =>
              router.push({
                pathname: "/progress-detail",
                params: { id: String(item.id) },
              })
            }
          />
        ))}
      </View>
    </ScreenWrapper>
  );
}
