import React from 'react';
import { StyleSheet, Text, View, Linking, TouchableOpacity } from 'react-native';
import { SOCKET_URL, CONTROL_URL } from '../../constants/config'; // Import ค่า Config มาแสดง

export default function SettingsScreen() {
  
  // ฟังก์ชันสำหรับเปิด URL ในเบราว์เซอร์
  const openUrl = (url) => {
    if (url && !url.includes("YOUR_NEW_NGROK_URL")) {
      Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Configuration</Text>
      <Text style={styles.subtitle}>
        This app is currently connected to the following endpoints.
        (Values from constants/config.js)
      </Text>

      {/* กล่องแสดง Socket URL */}
      <View style={styles.configBox}>
        <Text style={styles.configLabel}>WebSocket (Dashboard):</Text>
        <TouchableOpacity onPress={() => openUrl(SOCKET_URL)}>
          <Text style={styles.configValue}>{SOCKET_URL}</Text>
        </TouchableOpacity>
      </View>

      {/* กล่องแสดง Control URL */}
      <View style={styles.configBox}>
        <Text style={styles.configLabel}>API (Control Buttons):</Text>
        <Text style={styles.configValue}>{CONTROL_URL}</Text>
      </View>

      <Text style={styles.warning}>
        Reminder: If NGROK is restarted, you must update the URL in 
        `constants/config.js` and restart the app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 32,
  },
  configBox: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 14,
    color: '#9CA3AF', // Medium Gray
    marginBottom: 8,
  },
  configValue: {
    fontSize: 16,
    color: '#00FFAA', // Mint
    fontWeight: 'bold',
  },
  warning: {
    fontSize: 14,
    color: '#FBBF24', // Yellow
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
  }
});