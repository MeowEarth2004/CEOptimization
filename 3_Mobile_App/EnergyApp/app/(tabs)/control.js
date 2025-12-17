import { StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CONTROL_URL } from '../../constants/config';

export default function ControlScreen() {

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

// Cards Styles
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    gap: 20,
    // ✅ 1. เปลี่ยนพื้นหลังเป็นสีดำ
    backgroundColor: '#000000', 
    flexGrow: 1, // สั่งให้ขยายเต็มจอ
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    // ✅ 2. สีหัวข้อเป็นสีขาวนวล (อ่านสบายตากว่าขาวจ้า)
    color: '#ECEDEE', 
  },
  subHeader: {
    fontSize: 16,
    // ✅ 3. สีคำอธิบายเป็นสีเทาสว่าง
    color: '#9CA3AF', 
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
    elevation: 5,
    // ✅ 4. ปรับเงาเล็กน้อยให้ปุ่มไม่จมหายไปในสีดำ (Optional)
    shadowColor: '#FFF', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4,
  },
  // สีปุ่มคงเดิมตามที่ต้องการ
  gridBtn: { backgroundColor: '#4A90E2' },
  batBtn: { backgroundColor: '#50E3C2' },
  solarBtn: { backgroundColor: '#F5A623' },
  btnText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  }
});