import { ReactNode, RefObject } from "react";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenWrapperProps = {
  children: ReactNode;
  header?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
};

export default function ScreenWrapper({
  children,
  header,
  scrollRef,
}: ScreenWrapperProps) {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fcf7f9" }}
    >
      {header ? <View style={{ zIndex: 10 }}>{header}</View> : null}
      <ScrollView ref={scrollRef} className="px-8">
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1 }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
