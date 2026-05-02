import ScreenWrapper from "@/components/ScreenWrapper";
import { Text, View } from "react-native";

export default function ChatScreen() {
  return (
    <ScreenWrapper className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text>Chat Screen</Text>
      </View>

    </ScreenWrapper>
  );
}
