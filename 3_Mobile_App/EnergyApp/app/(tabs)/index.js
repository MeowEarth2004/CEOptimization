import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../constants/config'; // Import NGROK URL
import { LineChart } from 'react-native-chart-kit';

// --- Component การ์ดแสดงสถานะ (ปรับปรุงเล็กน้อย) ---
// เพิ่ม props 'isFullWidth' และ 'color'
const StatusCard = ({ label, value, unit, color = '#FFFFFF', isFullWidth = false }) => (
  // ถ้า isFullWidth = true, ให้ใช้ style 'cardFull'
  // ถ้าไม่ใช่, ให้ใช้ 'cardHalf'
  <View style={[styles.cardBase, isFullWidth ? styles.cardFull : styles.cardHalf]}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={[styles.cardValue, { color: color }]}>
      {value} <Text style={styles.cardUnit}>{unit}</Text>
    </Text>
  </View>
);

// --- Component กราฟ (เหมือนเดิม) ---
const PowerChart = ({ data }) => {
  // (โค้ดส่วน Chart เหมือนเดิม... ไม่มีการเปลี่ยนแปลง)
  if (data.length === 0) {
    return <Text style={styles.statusText}>Waiting for chart data...</Text>;
  }
  
  const chartConfig = {
    backgroundColor: '#374151',
    backgroundGradientFrom: '#1F2937',
    backgroundGradientTo: '#374151',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 255, 170, ${opacity})`, // #00FFAA
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: '#00FFAA' },
  };

  const chartData = {
    labels: data.map(() => ''), 
    datasets: [
      {
        data: data,
        color: (opacity = 1) => `rgba(0, 255, 170, ${opacity})`, 
        strokeWidth: 2,
      },
    ],
    legend: ['Power (W)'],
  };

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 32} 
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
    </View>
  );
};


// --- หน้าจอหลัก (ปรับปรุงส่วน useEffect และ return) ---
export default function DashboardScreen() {
  const [status, setStatus] = useState('Connecting...');
  const [trend, setTrend] = useState('N/A');
  const [realtimeData, setRealtimeData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
  });
  const [powerHistory, setPowerHistory] = useState([]); 

  useEffect(() => {
    // [REVISED] - เพิ่มการตรวจสอบ URL ก่อนเชื่อมต่อ
    if (!SOCKET_URL || SOCKET_URL.includes("YOUR_NEW_NGROK_URL")) {
      setStatus("❌ Invalid URL. Please update constants/config.js");
      console.error("Invalid Socket URL in config.js");
      return; // หยุดการทำงานถ้า URL ไม่ถูกต้อง
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'], 
    });

    socket.on('connect', () => {
      setStatus('✅ Connected');
      console.log('Connected to server via Socket.IO');
    });

    socket.on('disconnect', () => {
      setStatus('⚠️ Disconnected');
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (err) => {
      setStatus('❌ Connection Error');
      console.error('Socket.IO connection error:', err.message);
    });

    socket.on('update', (msg) => {
      const { data, trend } = msg;
      if (data) {
        setRealtimeData(data);
        setTrend(trend || 'N/A');

        setPowerHistory(prevData => {
          const newData = [...prevData, data.power || 0];
          if (newData.length > 20) {
            return newData.slice(newData.length - 20); 
          }
          return newData;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []); // ทำงานครั้งเดียวเมื่อเปิดหน้า

  return (
    // [REVISED] - ใช้ SafeAreaView คลุม ScrollView
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Energy Dashboard</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>

        {/* [REVISED] - กล่องแสดงผลหลัก ใช้ cardContainer คลุมทั้งหมด */}
        <View style={styles.cardContainer}>
          <StatusCard
            label="Voltage"
            value={realtimeData.voltage.toFixed(2)}
            unit="V"
            color="#34D399" // Green
          />
          <StatusCard
            label="Current"
            value={realtimeData.current.toFixed(2)}
            unit="A"
            color="#FBBF24" // Yellow
          />
          <StatusCard
            label="Power"
            value={realtimeData.power.toFixed(2)}
            unit="W"
            color="#00FFAA" // Mint
            isFullWidth={true} // กำหนดให้การ์ดนี้เต็มความกว้าง
          />
          <StatusCard
            label="AI Trend"
            value={trend}
            unit=""
            color="#60A5FA" // Blue
            isFullWidth={true} // กำหนดให้การ์ดนี้เต็มความกว้าง
          />
        </View>

        {/* กราฟ */}
        <PowerChart data={powerHistory} />
        
        {/* เพิ่มช่องว่างด้านล่าง */}
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Stylesheet (ปรับปรุง) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827', // สีพื้นหลังสำหรับขอบบน (iPhone)
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 16, // ย้าย padding มาไว้ที่นี่
  },
  header: {
    paddingVertical: 16, // ปรับ padding
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 4,
  },
  // [NEW] - Container สำหรับ Card ทั้งหมด
  cardContainer: {
    flexDirection: 'row', // จัดเรียงแนวนอน
    flexWrap: 'wrap',     // ถ้าล้นให้ขึ้นบรรทัดใหม่
    justifyContent: 'space-between', // จัดช่องไฟระหว่างการ์ด
  },
  // [NEW] - Style พื้นฐานสำหรับ Card
  cardBase: {
    backgroundColor: '#1F2937', 
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000', // เพิ่มเงา
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // [NEW] - Style สำหรับ Card ครึ่งจอ
  cardHalf: {
    width: '48%', // กว้าง 48% (เผื่อช่องไฟ)
  },
  // [NEW] - Style สำหรับ Card เต็มจอ
  cardFull: {
    width: '100%',
  },
  cardLabel: {
    fontSize: 16,
    color: '#D1D5DB', 
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardUnit: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
  }
});