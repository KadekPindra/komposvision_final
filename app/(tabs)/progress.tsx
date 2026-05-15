import AppHeader from "@/components/AppHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { database } from "@/database";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type CompostItem = {
  id: string;
  image: string;
  date: string;
  ratio: string;
  title: string;
  status: string;
  progress: number;
};

const mapCompostItem = (item: any): CompostItem => ({
  id: item.id,
  image: item.imageUri ?? "",
  date: item.lastUpdatedFormatted ?? "",
  ratio: item.ratio ?? "-",
  title: item.title ?? "Kompos",
  status: item.status ?? "Aktif",
  progress: typeof item.progress === "number" ? item.progress : 0,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collection = database.get("compost_batches");
    const subscription = collection
      .query()
      .observe()
      .subscribe({
        next: (records: any[]) => {
          setItems(records.map(mapCompostItem));
          setErrorMessage(null);
          setLoading(false);
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Terjadi kesalahan";
          setErrorMessage(message);
          setLoading(false);
        },
      });

    return () => subscription.unsubscribe();
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

        {!loading && errorMessage && (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4">
            <Text className="text-red-700 text-sm font-medium">
              {errorMessage}
            </Text>
          </View>
        )}

        {!loading && !errorMessage && items.length === 0 && (
          <View className="bg-white border border-gray-200 rounded-xl p-4">
            <Text className="text-gray-600 text-sm">
              Belum ada progress tersimpan.
            </Text>
          </View>
        )}

        {!errorMessage &&
          items.map((item) => (
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
