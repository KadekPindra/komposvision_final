import ScreenWrapper from "@/components/ScreenWrapper";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";

export default function ResultScreen() {
  const { image } = useLocalSearchParams();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // MOCK AI
    setTimeout(() => {
      setResult({
        carbon: 70,
        nitrogen: 30,
      });
    }, 1000);
  }, []);

  if (!result) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Analyzing...</Text>
      </View>
    );
  }

  const message =
    result.carbon > result.nitrogen
      ? "Terlalu banyak karbon, tambahkan sisa dapur"
      : "Terlalu banyak nitrogen, tambahkan bahan kering";

  return (
    <ScreenWrapper>
      <View className="flex-1 items-center">
        <Image
          source={{ uri: image as string }}
          className="w-full h-64 rounded-xl mb-4"
        />

        <Text className="text-xl font-bold mb-2">Hasil Analisis</Text>

        <Text>Karbon: {result.carbon}%</Text>
        <Text>Nitrogen: {result.nitrogen}%</Text>

        <View className="mt-4 p-4 bg-green-100 rounded-xl">
          <Text className="text-green-800 font-semibold">{message}</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}
