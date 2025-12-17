import { StyleSheet, ScrollView, View, RefreshControl, Dimensions, Text } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart } from "react-native-chart-kit";
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SERVER_URL } from '../../constants/config';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- COLOR PALETTE ---
const COLORS = {
  bg: '#121212',           // พื้นหลังดำสนิท
  cardBg: '#1E1E1E',       // พื้นหลังการ์ด
  accent: '#00FFA3',       // สีเขียวหลัก
  secondary: '#00E0FF',    // สีฟ้านีออน
  warning: '#FFD300',      // สีเหลือง
  textMain: '#FFFFFF',     // ตัวหนังสือขาว
  textSec: '#AAAAAA',      // ตัวหนังสือเทา
  border: '#333333'        // เส้นขอบ
};

export default function DashboardScreen() {
  const [data, setData] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    trend: "Waiting..."
  });
  
  const [graphData, setGraphData] = useState([0, 0, 0, 0, 0, 0]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/data`);
      const json = await response.json();
      
      const newPower = json.power || 0;

      setData({
        voltage: json.voltage || 0,
        current: json.current || 0,
        power: newPower,
        trend: json.trend || "N/A"
      });
      setLastUpdate(new Date().toLocaleTimeString());

      setGraphData(prevData => {
        const newData = [...prevData, newPower];
        if (newData.length > 10) newData.shift();
        return newData;
      });
      
    } catch (error) {
      console.log("Fetch Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* --- HEADER --- */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.appTitle}>Energy Monitor</Text>
            <Text style={styles.subTitle}>Real-time Control System</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.dot, { backgroundColor: lastUpdate ? COLORS.accent : 'red' }]} />
            <Text style={styles.statusText}>
              {lastUpdate ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        {/* --- MAIN STATS (GRID) --- */}
        <View style={styles.grid}>

          {/* Voltage */}
          <View style={styles.card}>
            <View style={styles.iconCircleBlue}>
              <IconSymbol name="bolt.fill" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.cardLabel}>Voltage</Text>
            <Text style={[styles.cardValue, { color: COLORS.secondary }]}>
              {data.voltage.toFixed(2)} <Text style={styles.unit}>V</Text>
            </Text>
          </View>

          {/* Current */}
          <View style={styles.card}>
            <View style={styles.iconCircleYellow}>
              <IconSymbol name="bolt.horizontal.fill" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.cardLabel}>Current</Text>
            <Text style={[styles.cardValue, { color: COLORS.warning }]}>
              {data.current.toFixed(2)} <Text style={styles.unit}>A</Text>
            </Text>
          </View>

          {/* Power */}
          <View style={[styles.card, styles.fullWidthCard]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardLabel}>Total Power</Text>
                <Text style={[styles.bigValue, { color: COLORS.accent }]}>
                  {data.power.toFixed(2)} <Text style={styles.bigUnit}>W</Text>
                </Text>
              </View>
              <View style={styles.iconCircleGreen}>
                <IconSymbol name="power" size={32} color={COLORS.accent} />
              </View>
            </View>
          </View>
        </View>

        {/* --- AI ANALYSIS --- */}
        <View style={styles.trendContainer}>
          <View style={styles.trendHeaderRow}>
             <IconSymbol name="brain.head.profile" size={20} color="#A020F0" />
             <Text style={styles.sectionTitle}>AI Prediction</Text>
          </View>
          <Text style={styles.trendText}>
            {data.trend === "Increasing usage" ? "⚠️  " : 
             data.trend === "Decreasing usage" ? "✅  " : "📊  "}
            {data.trend}
          </Text>
        </View>

        {/* --- GRAPH CHART --- */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Usage History</Text>
          <LineChart
            data={{
              labels: [], 
              datasets: [{ data: graphData }]
            }}
            width={Dimensions.get("window").width - 40}
            height={200}
            yAxisSuffix=" W"
            chartConfig={{
              backgroundColor: COLORS.cardBg,
              backgroundGradientFrom: COLORS.cardBg,
              backgroundGradientTo: COLORS.cardBg,
              decimalPlaces: 0,
              color: (opacity = 1) => COLORS.accent,
              labelColor: (opacity = 1) => COLORS.textSec,
              style: { borderRadius: 16 },
              propsForDots: { r: "5", strokeWidth: "2", stroke: COLORS.bg },
              propsForBackgroundLines: { strokeDasharray: "" } // เส้นทึบสวยๆ
            }}
            bezier
            style={styles.chartStyle}
          />
        </View>

        {/* Footer Space */}
        <View style={{ height: 20 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    padding: 20,
  },
  // Header
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: 0.5
  },
  subTitle: {
    fontSize: 12,
    color: COLORS.textSec,
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '600'
  },

  // Grid & Cards
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
    marginBottom: 20
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fullWidthCard: {
    width: '100%',
    marginTop: 5,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  // Text Styles
  cardLabel: {
    fontSize: 14,
    color: COLORS.textSec,
    marginBottom: 5,
    fontWeight: '500'
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.textSec
  },
  bigValue: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1
  },
  bigUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSec
  },

  // Icons
  iconCircleBlue: {
    backgroundColor: 'rgba(0, 224, 255, 0.15)',
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  iconCircleYellow: {
    backgroundColor: 'rgba(255, 211, 0, 0.15)',
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10
  },
  iconCircleGreen: {
    backgroundColor: 'rgba(0, 255, 163, 0.15)',
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center'
  },

  // AI & Trend
  trendContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#A020F0', // ม่วง AI
    marginBottom: 20
  },
  trendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10
  },
  trendText: {
    fontSize: 18,
    color: COLORS.textMain,
    fontWeight: '600'
  },

  // Chart
  chartContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginLeft: 5
  },
  chartStyle: {
    borderRadius: 16,
    marginVertical: 5
  }
});