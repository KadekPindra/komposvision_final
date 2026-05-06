import { ReactNode } from "react";
import { Text, View } from "react-native";

type AppHeaderProps = {
  title?: string;
  rightSlot?: ReactNode;
  className?: string;
};

export default function AppHeader({
  title = "KomposVision",
  rightSlot,
  className,
}: AppHeaderProps) {
  return (
    <View
      className={`flex-row justify-between items-center mt-2 mb-4 ${className ?? ""}`.trim()}
    >
      <Text className="text-green-600 font-bold text-lg">{title}</Text>
      <View>{rightSlot}</View>
    </View>
  );
}
