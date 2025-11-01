import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Dashboard from "./screens/Dashboard";
import Control from "./screens/Control";
import History from "./screens/History";
import Settings from "./screens/Settings";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: "#1F2937" },
          tabBarActiveTintColor: "#00FFAA",
          tabBarInactiveTintColor: "#9CA3AF",
        }}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="Control" component={Control} />
        <Tab.Screen name="History" component={History} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
