import AppHeader from "@/components/AppHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import type { CompostItem } from "@/services/compostProgress";
import {
  getCompostProgress,
  subscribeCompostProgress,
} from "@/services/compostProgressStore";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

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
  const [items, setItems] = useState<CompostItem[]>(getCompostProgress());

  useEffect(() => {
    return subscribeCompostProgress(() => {
      setItems(getCompostProgress());
    });
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
