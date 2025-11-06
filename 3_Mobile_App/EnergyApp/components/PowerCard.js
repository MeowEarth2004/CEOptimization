import React from "react";
import { View, Text } from "react-native";

export default function PowerCard({ title, value, unit }) {
  return (
    <View className="bg-gray-800 p-4 rounded-2xl shadow m-2 flex-1 items-center">
      <Text className="text-lg text-white">{title}</Text>
      <Text className="text-3xl font-bold text-green-400">{value} {unit}</Text>
    </View>
  );
}
