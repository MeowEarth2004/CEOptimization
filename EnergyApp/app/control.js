import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { CONTROL_URL } from '../constants/Config'; // Import NGROK URL

// --- Component ปุ่มควบคุม ---
const ControlButton = ({ label, color, onPress }) => (
  <TouchableOpacity
    style={[styles.button, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export default function ControlScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready');

  // ฟังก์ชันยิง API ไปยัง Flask
  const sendControlCommand = async (cmd) => {
    if (loading) return; // กันกดย้ำๆ
    setLoading(true);
    setStatus(`Sending: ${cmd}...`);

    try {
      // ยิง fetch ไปยัง NGROK_URL/control/COMMAND
      const response = await fetch(`${CONTROL_URL}/${cmd}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setStatus(`✅ ${data.status}`);
      Alert.alert('Success', data.status);

    } catch (error) {
      console.error('Failed to send command:', error);
      setStatus(`❌ Error: ${error.message}`);
      Alert.alert('Error', 'Failed to send command.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Power Source Control</Text>
      <Text style={styles.statusText}>{status}</Text>

      <View style={styles.buttonContainer}>
        <ControlButton
          label="Switch to Grid"
          color="#3B82F6" // Blue
          onPress={() => sendControlCommand('use_grid')}
        />
        <ControlButton
          label="Switch to Battery"
          color="#FBBF24" // Yellow
          onPress={() => sendControlCommand('use_battery')}
        />
        <ControlButton
          label="Switch to Solar"
          color="#10B981" // Green
          onPress={() => sendControlCommand('use_solar')}
        />
      </View>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Dark Blue/Gray
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 32,
    height: 40,
  },
  buttonContainer: {
    //
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});