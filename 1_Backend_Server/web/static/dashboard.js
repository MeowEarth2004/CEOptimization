// dashboard.js - Updated for History Graph
const socket = io();

// ตั้งค่ากราฟ Chart.js
const ctx = document.getElementById('energyChart').getContext('2d');
const energyChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // เวลา
        datasets: [{
            label: 'Power (W)',
            data: [],
            borderColor: '#00d2ff', // สีฟ้า Neon
            backgroundColor: 'rgba(0, 210, 255, 0.2)',
            borderWidth: 2,
            tension: 0.4, // เส้นโค้งสมูท
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, labels: { color: 'white' } }
        },
        scales: {
            x: { 
                ticks: { color: '#aaa' },
                grid: { color: '#333' }
            },
            y: { 
                beginAtZero: true,
                ticks: { color: '#aaa' },
                grid: { color: '#333' } 
            }
        }
    }
});

// ฟังก์ชันโหลดข้อมูลย้อนหลังจาก Database
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const historyData = await response.json();
        
        // เคลียร์กราฟเก่า
        energyChart.data.labels = [];
        energyChart.data.datasets[0].data = [];

        // ใส่ข้อมูลย้อนหลัง (reverse เพราะ SQL ดึงมาแบบ ล่าสุด->เก่า)
        historyData.reverse().forEach(item => {
            const timeLabel = new Date(item.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second:'2-digit' });
            energyChart.data.labels.push(timeLabel);
            energyChart.data.datasets[0].data.push(item.power);
        });
        energyChart.update();
        console.log("✅ Loaded history data:", historyData.length, "points");
    } catch (err) {
        console.error("❌ Failed to load history:", err);
    }
}

// โหลดประวัติทันทีที่เปิดเว็บ
loadHistory();

// รับค่า Real-time จาก SocketIO
socket.on('update', (msg) => {
    // 1. อัปเดตตัวเลข
    document.getElementById('voltage').innerText = msg.data.voltage.toFixed(2);
    document.getElementById('current').innerText = msg.data.current.toFixed(2);
    document.getElementById('power').innerText = msg.data.power.toFixed(2);
    document.getElementById('trend').innerText = msg.trend;

    // 2. อัปเดตกราฟ (เลื่อนข้อมูลไปทางซ้าย)
    const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second:'2-digit' });
    
    // เพิ่มข้อมูลใหม่
    energyChart.data.labels.push(now);
    energyChart.data.datasets[0].data.push(msg.data.power);

    // ถ้าข้อมูลเกิน 50 จุด ให้ลบจุดแรกออก (กราฟจะได้ไม่แน่นเกิน)
    if (energyChart.data.labels.length > 50) {
        energyChart.data.labels.shift();
        energyChart.data.datasets[0].data.shift();
    }
    
    energyChart.update();
});

// ฟังก์ชันปุ่มควบคุม
function sendCommand(cmd) {
    fetch(`/control/${cmd}`)
        .then(res => res.json())
        .then(data => alert(`✅ ${data.status}`))
        .catch(err => alert(`❌ Error: ${err}`));
}