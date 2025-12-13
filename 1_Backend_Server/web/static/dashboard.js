const socket = io(); // เชื่อมต่อไปที่ Main.py

// Element References
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const trendEl = document.getElementById("trend");

// --- Initial State ---
voltageEl.textContent = "— V";
currentEl.textContent = "— A";
powerEl.textContent = "— W";
trendEl.textContent = "Waiting for data...";

// --- Tabs Logic ---
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll('.tab-content');
  if(tabs.length > 0) {
      tabs.forEach((tc, index) => {
        tc.style.display = index === 0 ? 'block' : 'none';
      });
  }
});

document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
    const target = document.getElementById(tab);
    if (target) target.style.display = 'block';
  });
});

// --- Chart Setup ---
const ctxEl = document.getElementById("powerChart");
let chart;

if (ctxEl) {
    const ctx = ctxEl.getContext("2d");
    const chartData = {
      labels: Array(20).fill(""), // สร้าง label ว่างๆ ไว้ก่อน 20 ช่อง
      datasets: [{
        label: "Power (W)",
        data: Array(20).fill(0), // สร้าง data 0 ไว้ก่อน
        borderColor: "#00FFAA",
        backgroundColor: "rgba(0, 255, 170, 0.1)",
        fill: true,
        tension: 0.4, // เส้นโค้งสมูท
        pointRadius: 2
      }]
    };
    
    chart = new Chart(ctx, {
      type: "line",
      data: chartData,
      options: { 
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 0 }, // ปิด Animation เพื่อประสิทธิภาพตอนอัปเดตเร็วๆ
          scales: { 
              x: { display: false },
              y: { 
                  beginAtZero: true,
                  grid: { color: "#333" }
              } 
          },
          plugins: {
              legend: { labels: { color: 'white' } }
          }
      }
    });
}

// --- Socket.IO Handling ---

socket.on("connect", () => {
    console.log("✅ Connected to Backend Server");
    trendEl.textContent = "Connected";
    trendEl.style.color = "#00FFAA";
});

socket.on("update", (msg) => {
  console.log("📥 Data received:", msg); // ดู Log ใน Browser Console (F12)

  const d = msg.data || {};
  // แปลงค่าเป็น Float เพื่อความชัวร์
  const v = parseFloat(d.voltage).toFixed(2);
  const c = parseFloat(d.current).toFixed(2);
  const p = parseFloat(d.power).toFixed(2);

  // อัปเดตตัวเลข
  if(voltageEl) voltageEl.textContent = `${v} V`;
  if(currentEl) currentEl.textContent = `${c} A`;
  if(powerEl) powerEl.textContent = `${p} W`;
  if(trendEl) {
      trendEl.textContent = msg.trend || "N/A";
      trendEl.style.color = msg.trend.includes("⚠️") ? "orange" : "#00FFAA";
  }

  // อัปเดตตารางกราฟ
  if (chart) {
    chart.data.labels.push(new Date().toLocaleTimeString()); // ใส่เวลาปัจจุบันลงไปในแกน X
    chart.data.datasets[0].data.push(parseFloat(p));

    // ลบข้อมูลเก่าออกถ้าเกิน 20 จุด
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.update();
  }
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket.IO error:", err);
  trendEl.textContent = "Connection Error";
  trendEl.style.color = "red";
});

socket.on("disconnect", () => {
  console.warn("⚠️ Disconnected from server");
  trendEl.textContent = "Disconnected";
  trendEl.style.color = "red";
});