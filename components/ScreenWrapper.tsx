import { ReactNode, RefObject } from "react";
import { ScrollView, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenWrapperProps = {
  children: ReactNode;
  header?: ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  scrollable?: boolean;
};

export default function ScreenWrapper({
  children,
  header,
  scrollRef,
  scrollable = true,
}: ScreenWrapperProps) {
  const content = (
    <>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }} className="px-8">
        {children}
      </View>
    </>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fcf7f9" }}
    >
      {header ? <View style={{ zIndex: 10 }}>{header}</View> : null}
      {scrollable ? (
        <ScrollView ref={scrollRef}>{content}</ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </SafeAreaView>
  );
}
