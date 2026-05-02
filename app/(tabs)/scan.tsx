import { Entypo, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const [flash, setFlash] = useState<"off" | "on">("off");

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

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    const photo = await cameraRef.current.takePictureAsync();

    router.push({
      pathname: "/result",
      params: { image: photo.uri },
    });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      router.push({
        pathname: "/result",
        params: { image: uri },
      });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        ratio="16:9"
        selectedLens=""
        flash={flash}
      />

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
                  style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    padding: 12,
                    borderRadius: 999,
                    alignSelf: "flex-start",
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
                style={{
                  borderColor: "rgb(117, 111, 108)",
                  backgroundColor: "rgba(0,0,0,0.4)",
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
