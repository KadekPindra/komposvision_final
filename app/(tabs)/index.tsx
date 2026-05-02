import { View, Text, Image, ScrollView } from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <ScreenWrapper>
      <ScrollView className="flex-1">

        {/* HEADER */}
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-green-600 font-bold text-lg">
            KomposVision
          </Text>

          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            className="w-10 h-10 rounded-full"
          />
        </View>

        {/* GREETING */}
        <View className="mt-4">
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
              Kesehatan Kompos
            </Text>

            <Ionicons name="checkmark-circle" size={20} color="green" />
          </View>

          <View className="mt-2 flex-row items-center">
            <View className="bg-green-100 px-2 py-1 rounded-full">
              <Text className="text-green-600 text-xs font-semibold">
                Seimbang (Balanced)
              </Text>
            </View>

            <Text className="ml-auto text-gray-500 text-sm">
              70%
            </Text>
          </View>

          {/* PROGRESS BAR */}
          <View className="h-2 bg-gray-200 rounded-full mt-3">
            <View className="h-2 bg-green-500 rounded-full w-[70%]" />
          </View>

          <Text className="text-gray-400 text-xs mt-2">
            Fase Penguraian
          </Text>
        </View>

        {/* STATS */}
        <View className="flex-row justify-between mt-4">
          
          {/* CARD 1 */}
          <View className="bg-gray-100 rounded-2xl p-4 w-[48%]">
            <MaterialIcons name="recycling" size={20} color="green" />
            <Text className="text-xl font-bold mt-2">12.5 kg</Text>
            <Text className="text-gray-500 text-sm">
              Sampah Terurai
            </Text>
          </View>

          {/* CARD 2 */}
          <View className="bg-gray-100 rounded-2xl p-4 w-[48%]">
            <Ionicons name="leaf" size={20} color="green" />
            <Text className="text-xl font-bold mt-2">450</Text>
            <Text className="text-gray-500 text-sm">
              Poin Eco
            </Text>
          </View>
        </View>

        {/* AKTIVITAS */}
        <View className="mt-5">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-gray-700">
              Aktivitas Terbaru
            </Text>

            <Ionicons name="arrow-forward" size={18} color="gray" />
          </View>

          <View className="bg-gray-100 rounded-xl p-3 mt-3 flex-row items-center">
            <Ionicons name="leaf" size={20} color="green" />
            <View className="ml-3">
              <Text className="font-medium">
                Sisa Sayuran (Hijau)
              </Text>
              <Text className="text-gray-400 text-xs">
                Ditambahkan hari ini, 08:30
              </Text>
            </View>
          </View>

          <View className="bg-gray-100 rounded-xl p-3 mt-2 flex-row items-center">
            <Ionicons name="triangle" size={20} color="brown" />
            <View className="ml-3">
              <Text className="font-medium">
                Daun Kering (Coklat)
              </Text>
              <Text className="text-gray-400 text-xs">
                Kemarin, 16:45
              </Text>
            </View>
          </View>
        </View>

        {/* TIPS */}
        <View className="bg-yellow-100 rounded-2xl p-4 mt-5 mb-10">
          <Text className="font-semibold text-yellow-800">
            Tips Hari Ini
          </Text>

          <Text className="text-yellow-800 text-sm mt-2">
            Menjaga rasio 50:50 antara bahan hijau dan coklat akan
            mempercepat proses penguraian dan mencegah bau tak sedap.
          </Text>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}