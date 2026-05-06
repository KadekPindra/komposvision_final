import AppHeader from "@/components/AppHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { compostMaterials } from "@/services/materialsGuide";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSegments } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type TabKey = "carbon" | "nitrogen";

type TabConfig = {
  key: TabKey;
  label: string;
  icon: "pine-tree" | "leaf";
  iconColor: string;
  activeBg: string;
  inactiveBg: string;
  activeText: string;
  inactiveText: string;
};

const tabs: TabConfig[] = [
  {
    key: "carbon",
    label: "Bahan Karbon",
    icon: "pine-tree",
    iconColor: "#705f49",
    activeBg: "bg-[#f2dbbf]",
    inactiveBg: "bg-white",
    activeText: "text-[#705f49]",
    inactiveText: "text-gray-600",
  },
  {
    key: "nitrogen",
    label: "Bahan Nitrogen",
    icon: "leaf",
    iconColor: "#166534",
    activeBg: "bg-[#d1fae5]",
    inactiveBg: "bg-white",
    activeText: "text-[#166534]",
    inactiveText: "text-gray-600",
  },
];

const getMaterialIcon = (title: string) => {
  const name = title.toLowerCase();

  if (name.includes("daun") || name.includes("rumput")) {
    return { icon: "leaf", color: "#166534", bg: "#d1fae5" };
  }

  if (name.includes("kertas") || name.includes("kardus")) {
    return { icon: "file-document-outline", color: "#64748b", bg: "#e2e8f0" };
  }

  if (name.includes("serbuk") || name.includes("kayu")) {
    return { icon: "saw-blade", color: "#705f49", bg: "#f2dbbf" };
  }

  if (name.includes("jerami")) {
    return { icon: "pine-tree", color: "#8b6a4f", bg: "#f2dbbf" };
  }

  if (name.includes("sayur")) {
    return { icon: "food-apple", color: "#22c55e", bg: "#dcfce7" };
  }

  if (name.includes("buah")) {
    return { icon: "fruit-citrus", color: "#f59e0b", bg: "#fef3c7" };
  }

  if (name.includes("kopi")) {
    return { icon: "coffee", color: "#6b4f3f", bg: "#ede0d4" };
  }

  return { icon: "sprout", color: "#16a34a", bg: "#dcfce7" };
};

export default function MaterialsGuideScreen() {
  const segments = useSegments() as string[];

  const [activeTab, setActiveTab] = useState<TabKey>("carbon");
  const isInTabs = segments.includes("(tabs)");

  const materials = useMemo(() => {
    return activeTab === "carbon"
      ? compostMaterials.carbon
      : compostMaterials.nitrogen;
  }, [activeTab]);

  return (
    <ScreenWrapper>
      <AppHeader
        rightSlot={
          <Image
            source={{ uri: "https://i.pravatar.cc/100" }}
            className="w-10 h-10 rounded-full"
          />
        }
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-3 mb-8">
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 flex-row items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-3 ${
                  isActive ? tab.activeBg : tab.inactiveBg
                }`}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={20}
                  color={tab.iconColor}
                />
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? tab.activeText : tab.inactiveText
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-2xl font-bold">
          Sumber {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
          <Text
            style={{ color: activeTab === "carbon" ? "#705f49" : "#166534" }}
          >
            ({activeTab === "carbon" ? "Coklat" : "Hijau"})
          </Text>
        </Text>
        <Text className="text-gray-600 mt-4 mb-8 text-lg">
          {activeTab === "carbon"
            ? "Sumber karbon berasal dari bahan kering seperti daun gugur, kertas, atau kayu. Bahan ini membantu menjaga struktur kompos tetap berpori sehingga sirkulasi udara lancar. Karbon juga berperan penting dalam mengurangi bau dan menyeimbangkan kelembapan."
            : "Sumber nitrogen berasal dari bahan basah seperti sisa makanan, sayuran, dan buah-buahan. Bahan ini menyediakan nutrisi bagi mikroorganisme yang mempercepat proses penguraian. Nitrogen juga membantu menghasilkan panas yang dibutuhkan dalam proses kompos."}
        </Text>

        <View className="mt-6 gap-4">
          {materials.map((item) => (
            <View
              key={`${activeTab}-${item.title}`}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
            >
              <View className="flex-row items-start gap-3 mb-4">
                <View
                  className="rounded-full p-2"
                  style={{ backgroundColor: getMaterialIcon(item.title).bg }}
                >
                  <MaterialCommunityIcons
                    name={getMaterialIcon(item.title).icon as never}
                    size={20}
                    color={getMaterialIcon(item.title).color}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold">{item.title}</Text>
              </View>

              <Text className="text-gray-600 mt-2">{item.description}</Text>
              <View className="border-t border-gray-200 mt-8" />
              <View className="mt-3 flex-row items-center gap-3">
                <View className="flex-1 bg-gray-100 rounded-full px-3 py-2">
                  <Text className="text-sm font-semibold text-gray-700 text-center">
                    {item.weight}
                  </Text>
                </View>
                <View
                  className="flex-1 rounded-full px-3 py-2"
                  style={{
                    backgroundColor:
                      activeTab === "carbon" ? "#f5dec4" : "#c0f0b6",
                  }}
                >
                  <Text className="text-sm font-semibold text-gray-700 text-center">
                    {item.label}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}
