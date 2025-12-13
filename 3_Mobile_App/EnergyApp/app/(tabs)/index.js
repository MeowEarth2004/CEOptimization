import { StyleSheet, ScrollView, RefreshControl, View, StatusBar, Dimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import PowerCard from '../../components/PowerCard';
import useEnergyData from '../../hooks/useEnergyData';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit'; // ✅ นำเข้ากราฟ

export default function HomeScreen() {
  const data = useEnergyData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const isConnected = data.voltage > 0;
  const screenWidth = Dimensions.get('window').width;

  // 📊 ข้อมูลจำลองสำหรับกราฟ (เพื่อให้เห็นเส้นสวยๆ)
  // ในอนาคตพี่สามารถเก็บ Array จริงๆ จาก useEnergyData มาใส่ตรงนี้ได้
  const chartData = {
    labels: ["10:00", "10:05", "10:10", "10:15", "10:20", "Now"],
    datasets: [
      {
        data: [
          Math.random() * 1000, 
          Math.random() * 1000, 
          Math.random() * 1000, 
          Math.random() * 1000, 
          Math.random() * 1000, 
          data.power || 0 // เอาค่าจริงล่าสุดมาใส่จุดสุดท้าย
        ]
      }
    ]
  };

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']} 
      style={styles.background}
    >
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* === HEADER === */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>Energy Monitor</ThemedText>
            <ThemedText style={styles.date}>{new Date().toDateString()}</ThemedText>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: isConnected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 193, 7, 0.2)' }]}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#FFC107' }]} />
            <ThemedText style={{ color: isConnected ? '#4CAF50' : '#FFC107', fontWeight: 'bold', fontSize: 12 }}>
              {isConnected ? 'ONLINE' : 'CONNECTING'}
            </ThemedText>
          </View>
        </View>

        {/* === POWER CARD === */}
        <PowerCard 
          title="Total Power" 
          value={data.power} 
          unit="W"
          icon="bolt.fill" 
          colors={['#FF512F', '#DD2476']} 
          fullWidth={true}
        />

        {/* === GRID STATS === */}
        <View style={styles.row}>
          <PowerCard 
            title="Voltage" 
            value={data.voltage} 
            unit="V"
            icon="speedometer" 
            colors={['#4facfe', '#00f2fe']} 
          />
          <PowerCard 
            title="Current" 
            value={data.current} 
            unit="A"
            icon="waveform.path.ecg" 
            colors={['#43e97b', '#38f9d7']} 
          />
        </View>

        {/* === 📈 GRAPH SECTION (เพิ่มใหม่) === */}
        <View style={styles.chartContainer}>
          <ThemedText style={styles.sectionTitle}>Power Usage History</ThemedText>
          <LineChart
            data={chartData}
            width={screenWidth - 40} // กว้างเต็มจอ ลบ padding
            height={220}
            yAxisSuffix=" W"
            chartConfig={{
              backgroundColor: "transparent",
              backgroundGradientFrom: "transparent",
              backgroundGradientTo: "transparent",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726"
              }
            }}
            bezier // ทำให้เส้นโค้งสวยงาม
            style={styles.chart}
          />
        </View>

        {/* === AI ANALYSIS === */}
        <View style={styles.aiContainer}>
          <View style={styles.aiHeader}>
            <IconSymbol name="brain.head.profile" size={24} color="#fff" />
            <ThemedText style={styles.aiTitle}>AI Prediction</ThemedText>
          </View>
          <View style={styles.aiContent}>
             <ThemedText style={styles.trendLabel}>Current Trend:</ThemedText>
             <ThemedText style={styles.trendValue}>{data.trend}</ThemedText>
          </View>
          <ThemedText style={styles.aiSubtext}>
            System is analyzing real-time consumption patterns.
          </ThemedText>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { padding: 20, paddingTop: 60, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  date: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  // Chart Styles
  chartContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)', // พื้นหลังกราฟเข้มๆ
    borderRadius: 24,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },

  // AI Styles
  aiContainer: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  aiTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  aiContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  trendLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  trendValue: { fontSize: 18, fontWeight: 'bold', color: '#00f2fe' },
  aiSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
});