// ✅ แก้ไข: ลบ import ที่ไม่ใช้ออก
export function useEnergyData() {
  return {
    voltage: 0,
    current: 0,
    power: 0,
    trend: "Disabled",
    isConnected: false
  };
}