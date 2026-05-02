import { StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScreenWrapper({ children }: any) {
  return (
    <SafeAreaView className="px-8" style={{ flex: 1, backgroundColor: "#fcf7f9" }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
