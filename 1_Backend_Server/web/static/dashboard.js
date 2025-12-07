const socket = io();
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const trendEl = document.getElementById("trend");

// --- Initial State ---
voltageEl.textContent = "— V";
currentEl.textContent = "— A";
powerEl.textContent = "— W";
trendEl.textContent = "Waiting...";

// --- Tabs ---
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.tab-content').forEach((tc, index) => {
    tc.style.display = index === 0 ? 'block' : 'none';
  });
});

document.querySelectorAll('.tab-button').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
    document.getElementById(tab).style.display = 'block';
  });
});

// --- Chart ---
const ctx = document.getElementById("powerChart").getContext("2d");
const chartData = {
  labels: [],
  datasets: [{
    label: "Power (W)",
    data: [],
    borderColor: "#00FFAA",
    fill: false,
    tension: 0.2
  }]
};
const chart = new Chart(ctx, {
  type: "line",
  data: chartData,
  options: { scales: { x: { display: false } } }
});

// --- Socket.IO ---
socket.on("update", (msg) => {
  const d = msg.data || {};
  const v = Number(d.voltage) || 0;
  const c = Number(d.current) || 0;
  const p = Number(d.power) || 0;

  voltageEl.textContent = `${v.toFixed(2)} V`;
  currentEl.textContent = `${c.toFixed(2)} A`;
  powerEl.textContent = `${p.toFixed(2)} W`;
  trendEl.textContent = msg.trend || "N/A";

  chartData.labels.push("");
  chartData.datasets[0].data.push(p);
  if (chartData.labels.length > 20) {
    chartData.labels.shift();
    chartData.datasets[0].data.shift();
  }
  chart.update();
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket.IO error:", err);
  trendEl.textContent = "Connection error";
});

socket.on("disconnect", () => {
  console.warn("⚠️ Disconnected from server");
  trendEl.textContent = "Disconnected";
});
