import React from "react";
import { View, Button, Alert } from "react-native";
import { COMMANDS, SERVER_URL } from "../constants/config";

export default function Control() {
  const sendCommand = async (cmd) => {
    try {
      const res = await fetch(`${SERVER_URL}/control/${cmd}`);
      const json = await res.json();
      Alert.alert("Status", json.status);
    } catch (e) {
      Alert.alert("Error", "❌ Connection failed");
    }
  };

  return (
    <View className="flex-1 justify-center items-center">
      <Button title="Grid" onPress={() => sendCommand(COMMANDS.GRID)} color="#3B82F6" />
      <Button title="Battery" onPress={() => sendCommand(COMMANDS.BATTERY)} color="#FBBF24" />
      <Button title="Solar" onPress={() => sendCommand(COMMANDS.SOLAR)} color="#10B981" />
    </View>
  );
}
