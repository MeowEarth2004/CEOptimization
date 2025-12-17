import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function TabBarIcon({ name, color }) {
  return <Ionicons size={28} style={{ marginBottom: -3 }} name={name} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00FFAA',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#FFFFFF', //
      }}>
      <Tabs.Screen
        name="index" // คือไฟล์ app/(tabs)/index.js
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="stats-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="control" // คือไฟล์ app/(tabs)/control.js
        options={{
          title: 'Control',
          tabBarIcon: ({ color }) => <TabBarIcon name="game-controller" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings" // คือไฟล์ app/(tabs)/settings.js
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}