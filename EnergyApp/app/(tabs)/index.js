import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import { io } from 'socket.io-client';
import { SOCKET_URL } from 'constants/config'; // Import NGROK URL
import { LineChart } from 'react-native-chart-kit';

// --- สร้าง Component การ์ดแสดงสถานะ ---
// (เพื่อความสวยงาม เราสร้าง Component ย่อย)
const StatusCard = ({ label, value, unit, color = '#FFFFFF' }) => (
  <View style={styles.card}>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={[styles.cardValue, { color: color }]}>
      {value} <Text style={styles.cardUnit}>{unit}</Text>
    </Text>
  </View>
);

// --- Component กราฟ ---
const PowerChart = ({ data }) => {
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
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#00FFAA',
    },
  };

  const chartData = {
    labels: data.map(() => ''), // ซ่อน label แกน X
    datasets: [
      {
        data: data,
        color: (opacity = 1) => `rgba(0, 255, 170, ${opacity})`, // #00FFAA
        strokeWidth: 2,
      },
    ],
    legend: ['Power (W)'],
  };

  return (
    <View style={styles.chartContainer}>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 32} // กว้างเต็มจอ - padding
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );
};


// --- หน้าจอหลัก ---
export default function DashboardScreen() {
  const [status, setStatus] = useState('Connecting...');
  const [trend, setTrend] = useState('N/A');
  const [realtimeData, setRealtimeData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
  });
  const [powerHistory, setPowerHistory] = useState([]); // สำหรับเก็บข้อมูลกราฟ

  useEffect(() => {
    // เชื่อมต่อ Socket.IO ไปยัง NGROK URL
    const socket = io(SOCKET_URL, {
      transports: ['websocket'], // บังคับใช้ WebSocket
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

    // === นี่คือส่วนที่รับข้อมูล Real-time ===
    socket.on('update', (msg) => {
      const { data, trend } = msg;
      if (data) {
        setRealtimeData(data);
        setTrend(trend || 'N/A');

        // เพิ่มข้อมูลเข้ากราฟ และจำกัดให้มีแค่ 20 จุดล่าสุด
        setPowerHistory(prevData => {
          const newData = [...prevData, data.power || 0];
          if (newData.length > 20) {
            return newData.slice(newData.length - 20); // เอา 20 ตัวท้าย
          }
          return newData;
        });
      }
    });

    // Cleanup function
    return () => {
      socket.disconnect();
    };
  }, []); // ทำงานครั้งเดียวเมื่อเปิดหน้า

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Energy Dashboard</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {/* กล่องแสดงผลหลัก */}
      <View style={styles.cardContainer}>
        <StatusCard
          label="Voltage"
          value={realtimeData.voltage.toFixed(2)}
          unit="V"
          color="#34D399"
        />
        <StatusCard
          label="Current"
          value={realtimeData.current.toFixed(2)}
          unit="A"
          color="#FBBF24"
        />
      </View>
      <StatusCard
        label="Power"
        value={realtimeData.power.toFixed(2)}
        unit="W"
        color="#00FFAA"
      />
      <StatusCard
        label="AI Trend"
        value={trend}
        unit=""
        color="#60A5FA"
      />

      {/* กราฟ */}
      <PowerChart data={powerHistory} />

    </ScrollView>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Dark Blue/Gray
    padding: 16,
  },
  header: {
    marginBottom: 20,
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
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1F2937', // Darker Card
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 4, //
  },
  cardLabel: {
    fontSize: 16,
    color: '#D1D5DB', // Light Gray text
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardUnit: {
    fontSize: 18,
    color: '#9CA3AF', // Medium Gray
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
  }
});