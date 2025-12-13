import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LinearGradient } from 'expo-linear-gradient';

export default function PowerCard({ title, value, unit, icon, colors, fullWidth }) {
  return (
    <LinearGradient
      colors={colors || ['#ffffff', '#f0f0f0']} // สีพื้นหลังการ์ด
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, fullWidth && styles.fullWidth]}
    >
      <View style={styles.iconContainer}>
        <IconSymbol name={icon} size={32} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <View style={styles.valueRow}>
          <ThemedText style={styles.value}>{value}</ThemedText>
          <ThemedText style={styles.unit}>{unit}</ThemedText>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 24,
    width: '48%', // ปกติให้กว้างครึ่งจอ
    height: 140,
    justifyContent: 'space-between',
    // เพิ่มเงาให้ดูลอย
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fullWidth: {
    width: '100%', // ถ้าเป็นการ์ดใหญ่ ให้เต็มจอ
    flexDirection: 'row',
    alignItems: 'center',
    height: 100,
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)', // พื้นหลังไอคอนจางๆ
    padding: 10,
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)', // สีขาวจางๆ
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  unit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
});