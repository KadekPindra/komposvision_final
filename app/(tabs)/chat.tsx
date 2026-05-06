import AppHeader from "@/components/AppHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import {
  getCompostProgress,
  subscribeCompostProgress,
} from "@/services/compostProgressStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  time: string;
  sources?: string[];
};

export default function ChatScreen() {
  const [items, setItems] = useState(getCompostProgress());
  const [activeSourceId, setActiveSourceId] = useState<number | null>(
    items[0]?.id ?? null,
  );
  const [message, setMessage] = useState("");
  const chatScrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    return subscribeCompostProgress(() => {
      const nextItems = getCompostProgress();
      setItems(nextItems);
      if (!activeSourceId && nextItems[0]) {
        setActiveSourceId(nextItems[0].id);
      }
    });
  }, [activeSourceId]);

  const activeSource = useMemo(
    () => items.find((item) => item.id === activeSourceId),
    [items, activeSourceId],
  );

  const messages = useMemo<ChatMessage[]>(
    () => [
      {
        id: "bot-1",
        role: "assistant",
        text: "Halo! Aku siap bantu. Pilih sumber progres untuk jadi konteks chat.",
        time: "09:12",
        sources: ["Campuran Dapur Harian", "Tumpukan Daun Kering"],
      },
      {
        id: "user-1",
        role: "user",
        text: "Apa langkah terbaik agar komposku cepat matang?",
        time: "09:13",
      },
      {
        id: "bot-2",
        role: "assistant",
        text: "Berdasarkan progres terakhir, fokus pada aerasi dan keseimbangan rasio. Aduk tumpukan, lalu tambah bahan coklat agar lebih stabil.",
        time: "09:13",
        sources: ["Campuran Dapur Harian"],
      },
      {
        id: "user-2",
        role: "user",
        text: "Terima kasih, aku akan melakukannya.",
        time: "09:14",
      },
      {
        id: "bot-3",
        role: "assistant",
        text: "Semangat matang!",
        time: "09:14",
        sources: ["Tumpukan Daun Kering"],
      },
    ],
    [],
  );

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="pt-2">
          <AppHeader
            rightSlot={<Ionicons name="sparkles" size={20} color="#16a34a" />}
          />

          <View className="mt-3">
            <Text className="text-2xl font-bold text-gray-800">
              Kompos AI Assistant
            </Text>
            <Text className="text-gray-500 mt-1">
              Chat dengan konteks progres komposmu.
            </Text>
          </View>

          <View className="mt-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Sumber Konteks
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pr-4">
                {items.map((item) => {
                  const isActive = item.id === activeSourceId;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setActiveSourceId(item.id)}
                      className={`px-4 py-3 rounded-2xl border ${
                        isActive
                          ? "bg-green-600 border-green-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isActive ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className={`text-[11px] ${
                          isActive ? "text-green-50" : "text-gray-400"
                        }`}
                      >
                        {item.date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View className="mt-3 bg-gray-50 rounded-xl p-3">
              <Text className="text-xs text-gray-500">Konteks aktif</Text>
              <Text className="text-sm font-semibold text-gray-900 mt-1">
                {activeSource?.title ?? "Belum ada"}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {activeSource?.status ?? "Tidak ada status"} ·{" "}
                {activeSource?.ratio ?? "-"}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 mt-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <View className="flex-1">
            <ScrollView
              ref={chatScrollRef}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                chatScrollRef.current?.scrollToEnd({ animated: true })
              }
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              <View className="gap-4">
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <View key={msg.id} className="gap-2">
                      {!isUser ? (
                        <View className="flex-row items-center gap-2">
                          <View className="w-7 h-7 rounded-full bg-green-600 items-center justify-center">
                            <Text className="text-white text-[11px] font-semibold">
                              AI
                            </Text>
                          </View>
                          <Text className="text-xs text-gray-500">
                            Kompos AI
                          </Text>
                        </View>
                      ) : null}

                      <View
                        className={`rounded-3xl px-4 py-3 ${
                          isUser
                            ? "bg-green-600 self-end"
                            : "bg-gray-50 border border-gray-200 self-start"
                        }`}
                        style={{ maxWidth: "88%" }}
                      >
                        <Text
                          className={
                            isUser
                              ? "text-white text-sm"
                              : "text-gray-700 text-sm"
                          }
                        >
                          {msg.text}
                        </Text>
                      </View>

                      <View
                        className={`flex-row items-center ${
                          isUser ? "self-end" : "self-start"
                        }`}
                      >
                        <Text className="text-xs text-gray-400">
                          {msg.time}
                        </Text>
                      </View>

                      {!isUser && msg.sources?.length ? (
                        <View className="flex-row flex-wrap gap-2">
                          {msg.sources.map((source) => (
                            <View
                              key={`${msg.id}-${source}`}
                              className="bg-gray-100 px-2 py-1 rounded-full"
                            >
                              <Text className="text-[11px] text-gray-600">
                                {source}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <View className="pt-3">
            <View className="flex-row items-end gap-2">
              <View className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Tulis pertanyaan..."
                  className="text-sm text-gray-700"
                  multiline
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                className="bg-green-600 rounded-full w-11 h-11 items-center justify-center"
              >
                <Ionicons name="send" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-gray-400 mt-2">
              Jawaban AI bersifat rekomendasi awal.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
