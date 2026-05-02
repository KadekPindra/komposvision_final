import { Text, View } from "react-native";

type CompositionTextProps = {
  carbon: number;
  nitrogen: number;
};

export default function CompositionText({
  carbon,
  nitrogen,
}: CompositionTextProps) {
  const carbonClass = carbon > nitrogen ? "text-red-600" : "text-green-600";
  const nitrogenClass = nitrogen > carbon ? "text-red-600" : "text-green-600";

  return (
    <View className="flex flex-row items-center justify-center gap-14 py-20">
      <View className="flex flex-col">
        <Text className={`text-center font-bold ${carbonClass}`}>
          <Text className="text-5xl">{carbon}</Text> %
        </Text>
        <Text className={`text-center font-semibold -mt-2 text-xs ${carbonClass}`}>
          KARBON
        </Text>
      </View>
      <View className="flex flex-col">
        <Text className={`text-center font-bold ${nitrogenClass}`}>
          <Text className="text-5xl">{nitrogen}</Text> %
        </Text>
        <Text className={`text-center font-semibold -mt-2 text-xs ${nitrogenClass}`}>
          NITROGEN
        </Text>
      </View>
    </View>
  );
}
