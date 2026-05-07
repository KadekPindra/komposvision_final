import { Entypo, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { analyzeGarbage } from "@/services/aiService";
import { uploadGarbageImage } from "@/utils/supabase";

const DEV_USER_ID = "0f76a64a-d37e-4f69-af95-f32002ec1390";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold mb-4 text-center">
          Aplikasi membutuhkan akses kamera
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="bg-green-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (cameraError) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold mb-3 text-center">
          Kamera gagal dibuka
        </Text>
        <Text className="text-sm text-gray-600 text-center">{cameraError}</Text>
        <TouchableOpacity
          onPress={() => setCameraError(null)}
          className="mt-4 bg-green-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const processImage = async (localUri: string) => {
    setLoading(true);
    console.log("[Scan] processImage start", { localUri });
    try {
      // 1. Upload image to Supabase Storage
      console.log("[Scan] uploadGarbageImage start");
      const publicUrl = await uploadGarbageImage(localUri, DEV_USER_ID);
      console.log("[Scan] uploadGarbageImage success", { publicUrl });

      // 2. Call AI analysis API
      console.log("[Scan] analyzeGarbage start");
      const result = await analyzeGarbage(publicUrl, DEV_USER_ID);
      console.log("[Scan] analyzeGarbage success", { result });

      // 3. Navigate to result with full ScanResponse
      console.log("[Scan] navigate to result");
      router.push({
        pathname: "/result",
        params: { data: JSON.stringify(result) },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      console.log("[Scan] processImage error", { message, error });
      Alert.alert("Error", message);
    } finally {
      console.log("[Scan] processImage end");
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    console.log("[Scan] takePhoto start");
    const photo = await cameraRef.current.takePictureAsync();
    console.log("[Scan] takePhoto success", { uri: photo?.uri });
    await processImage(photo.uri);
  };

  const pickImage = async () => {
    console.log("[Scan] pickImage start");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log("[Scan] pickImage permission", {
      granted: permission.granted,
    });
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    console.log("[Scan] pickImage result", {
      canceled: result.canceled,
      assetsCount: result.assets?.length ?? 0,
    });

    if (!result.canceled) {
      await processImage(result.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        flash={flash}
        onMountError={(event) => {
          const message = event?.message ?? "Terjadi kesalahan kamera";
          console.log("[Scan] CameraView mount error", { message });
          setCameraError(message);
        }}
      />

      {/* Loading Overlay */}
      {loading && (
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        >
          <View className="bg-white rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="text-gray-700 font-semibold mt-3">
              Menganalisis gambar...
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Mohon tunggu sebentar
            </Text>
          </View>
        </View>
      )}

      <SafeAreaView className="absolute inset-0 justify-between px-6">
        <View className="flex-row items-center justify-between">
          {/* BACK BUTTON */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-black/40 p-2 rounded-full"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          {/* FLASH BUTTON */}
          <TouchableOpacity
            onPress={() => setFlash(flash === "off" ? "on" : "off")}
            className="bg-black/40 p-2 rounded-full"
          >
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* SCAN FRAME */}
        <View className="items-center justify-center">
          <View className="w-64 h-64 border-2 border-green-400 rounded-2xl opacity-80" />
        </View>

        {/* BOTTOM CONTROLS */}
        <View className="items-center">
          <View className="flex-row items-center w-full px-10">
            {/* LEFT (GALLERY) */}
            <View className="flex-1 items-start justify-center">
              <View className="self-start">
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={loading}
                  style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    padding: 12,
                    borderRadius: 999,
                    alignSelf: "flex-start",
                    opacity: loading ? 0.5 : 1,
                  }}
                  activeOpacity={0.7}
                >
                  <Entypo name="images" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* CENTER (CAPTURE) */}
            <View className="items-center">
              <TouchableOpacity
                onPress={takePhoto}
                disabled={loading}
                style={{
                  borderColor: "rgb(117, 111, 108)",
                  backgroundColor: "rgba(0,0,0,0.4)",
                  opacity: loading ? 0.5 : 1,
                }}
                className="w-20 h-20 rounded-full items-center justify-center border-2"
              >
                <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <View className="w-14 h-14 bg-white rounded-full border-2 border-green-600" />
                </View>
              </TouchableOpacity>
            </View>

            {/* RIGHT (EMPTY SPACE BALANCER) */}
            <View className="flex-1" />
          </View>

          <Text className="text-gray-300 mt-3">Tap untuk mengambil foto</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
