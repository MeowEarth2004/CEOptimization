import React from "react";
import { View, ScrollView, Text } from "react-native";
import PowerCard from "../components/PowerCard";
import useEnergyData from "../hooks/useEnergyData";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

export default function Dashboard() {
  const { voltage, current, power, trend } = useEnergyData();

  // --- Chart Data ---
  const chartData = {
    labels: Array(10).fill(""), // placeholder
    datasets: [{ data: Array(10).fill(power) }],
  };

  return (
    <ScrollView className="bg-gray-900 flex-1 p-4">
      <Text className="text-2xl text-center text-white font-bold mb-4">🔋 IoT Energy Dashboard</Text>
      <View className="flex-row">
        <PowerCard title="Voltage" value={voltage.toFixed(2)} unit="V" />
        <PowerCard title="Current" value={current.toFixed(2)} unit="A" />
        <PowerCard title="Power" value={power.toFixed(2)} unit="W" />
      </View>

      <View className="bg-gray-800 p-4 rounded-2xl shadow my-4">
        <Text className="text-lg mb-2 text-white">Power Usage Trend</Text>
        <Text className="text-xl font-semibold text-green-400">{trend}</Text>
      </View>

      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          backgroundColor: "#1F2937",
          backgroundGradientFrom: "#1F2937",
          backgroundGradientTo: "#111827",
          color: (opacity = 1) => `rgba(0, 255, 170, ${opacity})`,
        }}
        bezier
      />
    </ScrollView>
  );
}
