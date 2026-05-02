import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type PageHeaderProps = {
  title: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  onBack,
  rightSlot,
  className,
}: PageHeaderProps) {
  return (
    <View className={`px-8 pb-4 ${className}`} style={{ backgroundColor: "#fcf7f9" }}>
      <View className="flex-row items-center w-full">
        <View className="flex-1 items-start">
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              className="bg-black/40 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="absolute left-0 right-0 items-center">
          <Text className="text-xl font-bold">{title}</Text>
        </View>

        <View className="flex-1 items-end">{rightSlot}</View>
      </View>
    </View>
  );
}
