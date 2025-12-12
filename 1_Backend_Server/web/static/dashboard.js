// ✅ กำหนดให้ใช้ Polling เท่านั้น (แก้ปัญหา Error 400 บน Server Python 3.14)
const socket = io({
    transports: ['polling'],
    upgrade: false
});

// รับข้อมูลจาก Server
socket.on("update", (msg) => {
    console.log("Web Received:", msg);
    
    // อัปเดตตัวเลขบนหน้าเว็บ
    if (msg.data) {
        document.getElementById("voltage").innerText = msg.data.voltage + " V";
        document.getElementById("current").innerText = msg.data.current + " A";
        document.getElementById("power").innerText = msg.data.power + " W";
    }

    // อัปเดต Trend AI
    if (msg.trend) {
        document.getElementById("trend").innerText = msg.trend;
    }
});

socket.on("connect", () => {
    console.log("✅ Web Dashboard Connected!");
    document.getElementById("status").innerText = "Connected";
    document.getElementById("status").style.color = "green";
});

socket.on("disconnect", () => {
    console.warn("⚠️ Web Dashboard Disconnected");
    document.getElementById("status").innerText = "Disconnected";
    document.getElementById("status").style.color = "red";
});