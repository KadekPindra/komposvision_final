import ScreenWrapper from "@/components/ScreenWrapper";
import type { ScanResponse } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ResultScreen() {
  const { data } = useLocalSearchParams();
  const router = useRouter();

  // Parse the ScanResponse from navigation params
  let result: ScanResponse | null = null;
  try {
    if (data) {
      result = JSON.parse(data as string) as ScanResponse;
    }
  } catch {
    result = null;
  }

  if (!result) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-lg font-semibold mt-3 text-gray-700">
            Data tidak ditemukan
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-green-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Kembali</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mt-2 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-100 p-2 rounded-full mr-3"
          >
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">
            Hasil Analisis
          </Text>
        </View>

        {/* Image */}
        <Image
          source={{ uri: result.image_url }}
          className="w-full h-56 rounded-2xl"
          resizeMode="cover"
        />

        {/* Estimated Ratio Badge */}
        <View className="bg-green-100 rounded-2xl p-4 mt-4 items-center">
          <Text className="text-sm text-green-700 font-medium">
            Rasio Estimasi C:N
          </Text>
          <Text className="text-3xl font-bold text-green-700 mt-1">
            {result.estimated_ratio}
          </Text>
        </View>

        {/* Carbon Items */}
        <View className="mt-5">
          <View className="flex-row items-center mb-2">
            <Ionicons name="leaf-outline" size={18} color="#92400e" />
            <Text className="text-base font-semibold text-gray-700 ml-2">
              Bahan Karbon (Coklat)
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {result.carbon_items.map((item, index) => (
              <View
                key={`c-${index}`}
                className="bg-amber-100 rounded-full px-3 py-1.5 mr-2 mb-2"
              >
                <Text className="text-amber-800 text-sm font-medium">
                  {item}
                </Text>
              </View>
            ))}
            {result.carbon_items.length === 0 && (
              <Text className="text-gray-400 text-sm italic">
                Tidak ada bahan karbon terdeteksi
              </Text>
            )}
          </View>
        </View>

        {/* Nitrogen Items */}
        <View className="mt-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="nutrition-outline" size={18} color="#15803d" />
            <Text className="text-base font-semibold text-gray-700 ml-2">
              Bahan Nitrogen (Hijau)
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {result.nitrogen_items.map((item, index) => (
              <View
                key={`n-${index}`}
                className="bg-green-100 rounded-full px-3 py-1.5 mr-2 mb-2"
              >
                <Text className="text-green-800 text-sm font-medium">
                  {item}
                </Text>
              </View>
            ))}
            {result.nitrogen_items.length === 0 && (
              <Text className="text-gray-400 text-sm italic">
                Tidak ada bahan nitrogen terdeteksi
              </Text>
            )}
          </View>
        </View>

        {/* AI Instruction Card */}
        <View className="bg-blue-50 rounded-2xl p-4 mt-5 mb-10">
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="bulb-outline"
              size={20}
              color="#1d4ed8"
            />
            <Text className="text-base font-semibold text-blue-800 ml-2">
              Saran AI
            </Text>
          </View>
          <Text className="text-blue-700 text-sm leading-5">
            {result.ai_instruction}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
