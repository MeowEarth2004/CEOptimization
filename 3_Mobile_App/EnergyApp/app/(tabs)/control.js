import { StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CONTROL_URL } from '../../constants/config'; // เรียกใช้ URL จาก config กลาง

export default function ControlScreen() {

  // ฟังก์ชันส่งคำสั่ง
  const sendCommand = async (command, label) => {
    try {
      console.log(`Sending command: ${command}`);
      const response = await fetch(`${CONTROL_URL}/${command}`); 
      
      await response.json(); 
      
      if (response.ok) {
        Alert.alert("✅ Success", `Switching to ${label}`);
      } else {
        Alert.alert("❌ Error", "Failed to send command");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("⚠️ Connection Error", "Could not connect to server");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title" style={styles.header}>Energy Control</ThemedText>
      <ThemedText style={styles.subHeader}>Select power source mode:</ThemedText>

      {/* ปุ่มที่ 1: ใช้ไฟบ้าน */}
      <TouchableOpacity 
        style={[styles.button, styles.gridBtn]} 
        onPress={() => sendCommand('use_grid', 'Grid Power')}
      >
        <IconSymbol name="bolt.fill" size={40} color="white" />
        <ThemedText type="subtitle" style={styles.btnText}>Use Grid (PEA)</ThemedText>
      </TouchableOpacity>

      {/* ปุ่มที่ 2: ใช้แบตเตอรี่ */}
      <TouchableOpacity 
        style={[styles.button, styles.batBtn]} 
        onPress={() => sendCommand('use_battery', 'Battery')}
      >
        <IconSymbol name="battery.100" size={40} color="white" />
        <ThemedText type="subtitle" style={styles.btnText}>Use Battery</ThemedText>
      </TouchableOpacity>

      {/* ปุ่มที่ 3: ใช้โซลาร์เซลล์ */}
      <TouchableOpacity 
        style={[styles.button, styles.solarBtn]} 
        onPress={() => sendCommand('use_solar', 'Solar Energy')}
      >
        <IconSymbol name="sun.max.fill" size={40} color="white" />
        <ThemedText type="subtitle" style={styles.btnText}>Use Solar</ThemedText>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    gap: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    padding: 25,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    elevation: 5, // เงา Android
    shadowColor: '#000', // เงา iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gridBtn: { backgroundColor: '#4A90E2' },   // สีฟ้า
  batBtn: { backgroundColor: '#50E3C2' },    // สีเขียวมิ้นท์
  solarBtn: { backgroundColor: '#F5A623' },  // สีส้ม
  btnText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  }
});