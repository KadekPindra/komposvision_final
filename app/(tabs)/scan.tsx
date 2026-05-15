import { Entypo, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTensorflowModel } from "react-native-fast-tflite";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  usePhotoOutput,
} from "react-native-vision-camera";
import { useResizer } from "react-native-vision-camera-resizer";
import { createSynchronizable, runOnJS } from "react-native-worklets";

import { detectBlurFromImage } from "@/services/blurDetection";
import {
  LiveDetection,
  parseYoloOutput,
  WASTE_CLASSES,
} from "@/services/liveWasteDetection";
import { detectContaminantsFromImage } from "@/services/yoloContaminant";
import { analyzeComposition } from "@/services/yoloSegmentation";

const MODEL_NUM_CLASSES = WASTE_CLASSES.length;

export default function ScanScreen() {
  // ── hooks ──────────────────────────────────────────────────────────────────
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const router = useRouter();

  const [flash, setFlash] = useState<"off" | "on">("off");
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detections, setDetections] = useState<LiveDetection[]>([]);
  const [viewSize, setViewSize] = useState({ width: 1, height: 1 });

  const model = useTensorflowModel(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/assets/model/yolo11m_contaminant.tflite"),
    ["core-ml"],
  );
  const activeModel = model.state === "loaded" ? model.model : undefined;

  // createSynchronizable: mutable container readable from worklets.
  // Stable identity (useMemo []) prevents onFrame from being re-created when
  // the TFLite model finishes loading, which would otherwise cause the Camera
  // to re-attach its native output views and trigger "addViewAt" on Android.
  const modelSync = useMemo(() => createSynchronizable<any>(null), []);
  useEffect(() => {
    modelSync.setBlocking(activeModel ?? null);
  }, [activeModel, modelSync]);

  const { resizer } = useResizer({
    width: 640,
    height: 640,
    channelOrder: "rgb",
    dataType: "float32",
    scaleMode: "cover",
    pixelLayout: "interleaved",
  });

  // Throttle UI updates to ~10fps to limit React re-renders from frame output
  const lastDetectionRef = useRef(0);
  const applyDetections = useCallback((output: Float32Array) => {
    const now = Date.now();
    if (now - lastDetectionRef.current < 100) return;
    lastDetectionRef.current = now;
    setDetections(parseYoloOutput(output, MODEL_NUM_CLASSES));
  }, []);

  // onFrame captures only stable values: modelSync, resizer, applyDetections.
  // This keeps frameOutput's identity stable across renders.
  const frameOutput = useFrameOutput({
    pixelFormat: "yuv",
    onFrame: (frame) => {
      "worklet";
      const m = modelSync.getDirty();
      if (resizer != null && m != null) {
        const gpuFrame = resizer.resize(frame);
        const buffer = gpuFrame.getPixelBuffer();
        gpuFrame.dispose();
        const [rawOutput] = m.runSync([buffer]);
        runOnJS(applyDetections)(rawOutput as Float32Array);
      }
      frame.dispose();
    },
  });

  const photoOutput = usePhotoOutput();

  const outputs = useMemo(
    () => [photoOutput, frameOutput],
    [photoOutput, frameOutput],
  );

  // Instrumentation: log when outputs / camera-related identities change
  useEffect(() => {
    try {
      console.log("[Scan] outputs changed", {
        photoOutput: !!photoOutput,
        frameOutput: !!frameOutput,
        outputsLength: outputs.length,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.log("[Scan] outputs log error", e);
    }
  }, [photoOutput, frameOutput, outputs]);

  useEffect(() => {
    console.log(
      "[Scan] component mounted/rendered - device",
      device?.id ?? "no-device",
      "modelState",
      model.state,
    );
  }, [device, model.state]);

  // ── conditional renders ────────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-white">
        <Text className="mb-4 text-lg font-semibold text-center">
          Aplikasi membutuhkan akses kamera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="px-6 py-3 bg-green-600 rounded-xl"
        >
          <Text className="font-semibold text-white">Izinkan Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-3 text-gray-600">Menyiapkan kamera...</Text>
      </View>
    );
  }

  if (cameraError) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-white">
        <Text className="mb-3 text-lg font-semibold text-center">
          Kamera gagal dibuka
        </Text>
        <Text className="text-sm text-center text-gray-600">{cameraError}</Text>
        <TouchableOpacity
          onPress={() => setCameraError(null)}
          className="px-6 py-3 mt-4 bg-green-600 rounded-xl"
        >
          <Text className="font-semibold text-white">Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── handlers ───────────────────────────────────────────────────────────────
  const processImage = async (localUri: string) => {
    setLoading(true);
    try {
      const blurResult = await detectBlurFromImage(localUri);
      if (blurResult.isBlurry) {
        Alert.alert("Gambar terlalu buram", "Silakan ambil foto ulang.");
        return;
      }

      const contaminants = await detectContaminantsFromImage(localUri);
      const composition = await analyzeComposition(localUri);

      router.push({
        pathname: "/result",
        params: {
          data: JSON.stringify({
            imageUri: localUri,
            carbonItems: composition.carbonItems,
            nitrogenItems: composition.nitrogenItems,
            estimatedRatio: composition.estimatedRatio,
            composition: composition.composition,
            contaminants,
            aiInstruction:
              contaminants.length > 0
                ? "Kontaminan terdeteksi, mohon dipisahkan."
                : "Bahan organik terdeteksi.",
          }),
        },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Terjadi kesalahan",
      );
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const photoFile = await photoOutput.capturePhotoToFile(
        { flashMode: flash === "on" ? "on" : "off" },
        {},
      );
      const uri = photoFile.filePath.startsWith("file://")
        ? photoFile.filePath
        : `file://${photoFile.filePath}`;
      await processImage(uri);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Gagal mengambil foto",
      );
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      await processImage(result.assets[0].uri);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setViewSize({ width, height });
      }}
    >
      <Camera
        style={styles.camera}
        device={device}
        isActive={!loading}
        outputs={outputs}
        implementationMode="compatible"
        onError={(error: any) => {
          setCameraError(error?.message ?? "Terjadi kesalahan kamera");
        }}
      />

      {/* Single overlay container keeps Camera's sibling list stable, avoiding
          Android "addViewAt: child already has a parent" view hierarchy errors */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Bounding box overlays */}
        {!loading &&
          detections.map((det) => {
            const key = `${det.classId}-${Math.round(det.bbox.x * 1000)}-${Math.round(det.bbox.y * 1000)}`;
            return (
              <View
                key={key}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: det.bbox.x * viewSize.width,
                  top: det.bbox.y * viewSize.height,
                  width: det.bbox.width * viewSize.width,
                  height: det.bbox.height * viewSize.height,
                  borderWidth: 2,
                  borderColor: det.color,
                  borderRadius: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: det.color,
                    paddingHorizontal: 5,
                    paddingVertical: 2,
                    borderRadius: 3,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}
                    numberOfLines={1}
                  >
                    {det.className} {Math.round(det.confidence * 100)}%
                  </Text>
                </View>
              </View>
            );
          })}

        {/* Loading overlay */}
        {loading && (
          <View
            style={[StyleSheet.absoluteFill, styles.loadingOverlay]}
            pointerEvents="auto"
          >
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingTitle}>Menganalisis gambar...</Text>
              <Text style={styles.loadingSubtitle}>Mohon tunggu sebentar</Text>
            </View>
          </View>
        )}

        {/* Camera controls */}
        <SafeAreaView style={styles.controls} pointerEvents="box-none">
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>

            {/* Model status + legend */}
            <View style={styles.statusPill}>
              {model.state === "loading" ? (
                <>
                  <ActivityIndicator size="small" color="#86efac" />
                  <Text style={styles.statusText}>Memuat model...</Text>
                </>
              ) : model.state === "loaded" ? (
                <>
                  <View style={styles.legendRow}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#22c55e" }]}
                    />
                    <Text style={styles.statusText}>Organik</Text>
                  </View>
                  <View style={styles.legendRow}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#ef4444" }]}
                    />
                    <Text style={styles.statusText}>Anorganik</Text>
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#f87171" }]}
                  />
                  <Text style={styles.statusText}>Model error</Text>
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setFlash(flash === "off" ? "on" : "off")}
              style={styles.iconBtn}
            >
              <Ionicons
                name={flash === "on" ? "flash" : "flash-off"}
                size={22}
                color="white"
              />
            </TouchableOpacity>
          </View>

          <View />

          {/* Bottom controls */}
          <View style={styles.bottomSection}>
            <View style={styles.bottomRow}>
              <View style={styles.sideSlot}>
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={loading}
                  style={[styles.iconBtn, loading && styles.disabled]}
                >
                  <Entypo name="images" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={takePhoto}
                disabled={loading}
                style={[styles.shutterOuter, loading && styles.disabled]}
              >
                <View style={styles.shutterInner}>
                  <View style={styles.shutterCore} />
                </View>
              </TouchableOpacity>

              <View style={styles.sideSlot} />
            </View>

            <Text style={styles.hint}>
              {detections.length > 0
                ? `${detections.length} objek terdeteksi  ·  Tap untuk analisis lengkap`
                : "Arahkan kamera ke sampah"}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  loadingOverlay: {
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  loadingTitle: {
    marginTop: 12,
    fontWeight: "600",
    color: "#374151",
  },
  loadingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#9ca3af",
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8,
  },
  statusText: { fontSize: 12, color: "#fff" },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  bottomSection: { alignItems: "center" },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  sideSlot: { flex: 1, alignItems: "flex-start", justifyContent: "center" },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgb(117,111,108)",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterCore: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  disabled: { opacity: 0.5 },
  hint: {
    marginTop: 12,
    fontSize: 13,
    color: "#d1d5db",
    textAlign: "center",
  },
});
