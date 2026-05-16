import { Entypo, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
import { LiveDetection, WASTE_CLASSES } from "@/services/liveWasteDetection";
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

  const model = useTensorflowModel(
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/assets/model/yolo11m_contaminant.tflite"),
    [],
  );
  const activeModel = model.state === "loaded" ? model.model : undefined;

  // Log model loading errors
  useEffect(() => {
    if (model.state === "error") {
      console.error("[Scan] TFLite model load FAILED:", model.error);
    } else if (model.state === "loaded") {
      console.log("[Scan] TFLite model loaded OK");
    }
  }, [model.state]);

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
  const applyDetections = useCallback((results: LiveDetection[]) => {
    const now = Date.now();
    if (now - lastDetectionRef.current < 100) return;
    lastDetectionRef.current = now;
    setDetections(results);
  }, []);

  // onFrame captures only stable values: modelSync, resizer, applyDetections.
  // This keeps frameOutput's identity stable across renders.
  const frameCountRef = useRef(0);
  const logFrameStatus = useCallback((status: string, extra?: string) => {
    frameCountRef.current++;
    // Log every 30th frame to avoid flooding
    if (frameCountRef.current % 30 === 1) {
      console.log(
        `[Scan:frame] #${frameCountRef.current} ${status}`,
        extra ?? "",
      );
    }
  }, []);

  // ─── Stable worklet callback ─────────────────────────────────────────────
  // YOLO parsing is done INSIDE the worklet because TypedArray/ArrayBuffer
  // cannot survive runOnJS serialization. Only the small LiveDetection[]
  // result (max 20 plain objects) is sent back to JS thread.
  const numClasses = MODEL_NUM_CLASSES;
  const onFrame = useCallback(
    (frame: any) => {
      "worklet";
      try {
        const m = modelSync.getDirty();
        if (resizer == null || m == null) {
          runOnJS(logFrameStatus)(
            "skip",
            `resizer=${resizer != null} model=${m != null}`,
          );
          frame.dispose();
          return;
        }
        const gpuFrame = resizer.resize(frame);
        const buffer = gpuFrame.getPixelBuffer();
        gpuFrame.dispose();
        const outputs = m.runSync([buffer]);
        const output = new Float32Array(outputs[0]);

        // ── Inline YOLO NMS parsing (worklet-safe, no external deps) ──
        const CONF = 0.4;
        const IOU = 0.45;
        const ANCHORS = 8400;
        const nc = numClasses; // captured from closure

        type Box = [number, number, number, number];
        type Cand = { cid: number; conf: number; box: Box };
        const cands: Cand[] = [];

        for (let i = 0; i < ANCHORS; i++) {
          let maxC = 0;
          let maxCl = 0;
          for (let c = 0; c < nc; c++) {
            const v = output[(4 + c) * ANCHORS + i];
            if (v > maxC) {
              maxC = v;
              maxCl = c;
            }
          }
          if (maxC < CONF) continue;
          const cx = output[0 * ANCHORS + i] / 640;
          const cy = output[1 * ANCHORS + i] / 640;
          const w = output[2 * ANCHORS + i] / 640;
          const h = output[3 * ANCHORS + i] / 640;
          cands.push({
            cid: maxCl,
            conf: maxC,
            box: [cx - w / 2, cy - h / 2, w, h],
          });
        }

        // NMS
        cands.sort((a, b) => b.conf - a.conf);
        const supp = new Array(cands.length).fill(false);
        const kept: Cand[] = [];
        for (let i = 0; i < cands.length; i++) {
          if (supp[i]) continue;
          kept.push(cands[i]);
          for (let j = i + 1; j < cands.length; j++) {
            if (supp[j]) continue;
            const a = cands[i].box;
            const b = cands[j].box;
            const iw = Math.max(
              0,
              Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]),
            );
            const ih = Math.max(
              0,
              Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]),
            );
            const inter = iw * ih;
            const union = a[2] * a[3] + b[2] * b[3] - inter;
            if (union > 0 && inter / union > IOU) supp[j] = true;
          }
        }

        // Map to LiveDetection (plain objects that survive runOnJS)
        // Class mapping: 0=inorganic, 1=organic
        const classInfo = [
          { label: "Anorganik", type: "inorganic", color: "#ef4444" },
          { label: "Organik", type: "organic", color: "#22c55e" },
        ];
        const results: any[] = kept.slice(0, 20).map((c) => {
          const ci = classInfo[c.cid] ?? {
            label: `Kelas ${c.cid}`,
            type: "inorganic",
            color: "#f97316",
          };
          return {
            classId: c.cid,
            className: ci.label,
            type: ci.type,
            confidence: c.conf,
            color: ci.color,
            bbox: {
              x: c.box[0],
              y: c.box[1],
              width: c.box[2],
              height: c.box[3],
            },
          };
        });

        runOnJS(applyDetections)(results);
        runOnJS(logFrameStatus)("ok", `det=${results.length}`);
      } catch (e) {
        const msg =
          typeof e === "object" && e != null && "message" in e
            ? String((e as any).message)
            : `${e}`;
        runOnJS(logFrameStatus)("ERROR", msg);
      }
      frame.dispose();
    },
    [modelSync, resizer, applyDetections, logFrameStatus, numClasses],
  );

  const frameOutput = useFrameOutput({
    pixelFormat: "yuv",
    onFrame,
  });

  const photoOutput = usePhotoOutput();

  const outputs = useMemo(
    () => [photoOutput, frameOutput],
    [photoOutput, frameOutput],
  );

  // Instrumentation: log when outputs / camera-related identities change
  useEffect(() => {
    console.log("[Scan] outputs changed", {
      photoOutput: !!photoOutput,
      frameOutput: !!frameOutput,
      outputsLength: outputs.length,
    });
  }, [photoOutput, frameOutput, outputs]);

  useEffect(() => {
    console.log(
      "[Scan] device:",
      device?.id ?? "no-device",
      "| model:",
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

      // DEMO: hardcoded result for the "kardus + kulit pisang + daun kering"
      // scenario. Bypasses TFLite inference until the segmentation model is
      // wired up. Composition percent is item-count based (matches
      // analyzeComposition fallback): 2 carbon items + 1 nitrogen item → 67/33.
      const demoCarbonItems = ["Kardus", "Daun Kering"];
      const demoNitrogenItems = ["Daun Hijau"];

      router.push({
        pathname: "/result",
        params: {
          data: JSON.stringify({
            imageUri: localUri,
            carbonItems: demoCarbonItems,
            nitrogenItems: demoNitrogenItems,
            estimatedRatio: "45:1",
            composition: [
              {
                label: "Bahan Hijau (Nitrogen)",
                detail: demoNitrogenItems.join(", "),
                percent: 33,
                tone: "green",
              },
              {
                label: "Bahan Coklat (Karbon)",
                detail: demoCarbonItems.join(", "),
                percent: 67,
                tone: "brown",
              },
            ],
            contaminants: [],
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
    <View style={styles.container}>
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

            {detections.length > 0 ? (
              <View style={styles.detectionPanel}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {detections.map((det, idx) => (
                    <View
                      key={`chip-${idx}`}
                      style={[styles.chip, { borderColor: det.color }]}
                    >
                      <View
                        style={[styles.chipDot, { backgroundColor: det.color }]}
                      />
                      <Text style={styles.chipText}>
                        {det.className} {Math.round(det.confidence * 100)}%
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <Text style={styles.hint}>Tap untuk analisis lengkap</Text>
              </View>
            ) : (
              <Text style={styles.hint}>Arahkan kamera ke sampah</Text>
            )}
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
    marginTop: 8,
    fontSize: 13,
    color: "#d1d5db",
    textAlign: "center",
  },
  detectionPanel: {
    marginTop: 10,
    alignItems: "center",
    width: "100%",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
