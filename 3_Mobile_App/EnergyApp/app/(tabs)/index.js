import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react'; // ✅ ต้องมี useEffect ตรงนี้
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import PowerCard from '../../components/PowerCard';
import useEnergyData from '../../hooks/useEnergyData';

// ✅ เพิ่มส่วนประกอบของ Socket.IO
import { io } from "socket.io-client";
import { SOCKET_URL } from "../../constants/config";

export default function HomeScreen() {
  const data = useEnergyData();
  const [refreshing, setRefreshing] = useState(false);

  // ✅ 1. ใส่ useEffect ไว้ข้างใน Component ตรงนี้ (ห้ามไว้นอกสุด)
  useEffect(() => {
    // เชื่อมต่อ Socket แบบ Polling (เพื่อแก้ปัญหา Python 3.14 Crash)
    const socket = io(SOCKET_URL, {
      transports: ["polling"], // 👈 สำคัญมาก
    });

    socket.on("connect", () => {
      console.log("✅ Index Screen Connected to Server");
    });

    return () => {
      socket.disconnect();
    };
  }, []); // ทำงานแค่ครั้งเดียวตอนเปิดหน้า

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Section */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.greeting}>Hello, Engineer!</ThemedText>
        <ThemedText style={styles.subtitle}>System Status: <ThemedText style={{color: '#4CAF50', fontWeight: 'bold'}}>Normal</ThemedText></ThemedText>
      </ThemedView>

      {/* Main Info Cards */}
      <ThemedView style={styles.cardContainer}>
        <PowerCard 
          title="Voltage" 
          value={`${data.voltage} V`} 
          icon="bolt.fill" 
          color="#FFD700" 
        />
        <PowerCard 
          title="Current" 
          value={`${data.current} A`} 
          icon="waveform.path.ecg" 
          color="#00BFFF" 
        />
        <PowerCard 
          title="Power" 
          value={`${data.power} W`} 
          icon="power" 
          color="#FF4500" 
        />
      </ThemedView>

      {/* AI Prediction Section */}
      <ThemedView style={styles.aiContainer}>
        <ThemedView style={styles.aiHeader}>
          <IconSymbol name="brain.head.profile" size={24} color="#A020F0" />
          <ThemedText type="subtitle" style={styles.aiTitle}>AI Analysis</ThemedText>
        </ThemedView>
        <ThemedText style={styles.aiText}>
          Trend: <ThemedText style={{fontWeight: 'bold'}}>{data.trend}</ThemedText>
        </ThemedText>
        <ThemedText style={styles.aiSubtext}>
          Based on real-time consumption patterns.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    gap: 20,
  },
  header: {
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  aiContainer: {
    backgroundColor: '#f0f0f0', // Light Gray background
    padding: 20,
    borderRadius: 16,
    marginTop: 10,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  aiText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  aiSubtext: {
    fontSize: 12,
    color: '#888',
  },
});