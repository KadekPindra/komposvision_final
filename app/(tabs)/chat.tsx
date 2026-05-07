import AppHeader from "@/components/AppHeader";
import ScreenWrapper from "@/components/ScreenWrapper";
import { sendChatMessage } from "@/services/aiService";
import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const DEV_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Halo! 👋 Saya asisten kompos AI. Tanyakan apa saja tentang kompos dan pengelolaan sampah organik.",
      sender: "bot",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: trimmed,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const botReply = await sendChatMessage(trimmed, DEV_USER_ID);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        text: botReply,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Gagal mengirim pesan";
      Alert.alert("Error", errorMsg);

      // Add error bubble so user sees it inline
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        text: "⚠️ Gagal mendapat respons. Silakan coba lagi.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === "user";

    return (
      <View
        className={`mb-3 px-1 ${isUser ? "items-end" : "items-start"}`}
      >
        <View
          className={`rounded-2xl px-4 py-3 max-w-[80%] ${
            isUser ? "bg-green-600" : "bg-gray-100"
          }`}
          style={
            isUser
              ? { borderBottomRightRadius: 4 }
              : { borderBottomLeftRadius: 4 }
          }
        >
          <Text
            className={`text-sm leading-5 ${
              isUser ? "text-white" : "text-gray-800"
            }`}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center py-2 mb-2">
          <View className="bg-green-100 p-2 rounded-full mr-3">
            <Ionicons name="chatbubbles" size={22} color="#16a34a" />
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-800">
              Asisten Kompos
            </Text>
            <Text className="text-xs text-gray-400">Powered by AI</Text>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 8 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {loading && (
          <View className="flex-row items-center px-2 py-2">
            <ActivityIndicator size="small" color="#16a34a" />
            <Text className="text-gray-400 text-xs ml-2">
              AI sedang mengetik...
            </Text>
          </View>
        )}

        {/* Input Bar */}
        <View className="flex-row items-end py-2 border-t border-gray-200">
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-800 mr-2"
            placeholder="Ketik pesan..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={loading || !inputText.trim()}
            className="bg-green-600 p-3 rounded-full"
            style={{
              opacity: loading || !inputText.trim() ? 0.5 : 1,
            }}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
