const socket = io();
const voltageEl = document.getElementById("voltage");
const currentEl = document.getElementById("current");
const powerEl = document.getElementById("power");
const trendEl = document.getElementById("trend");

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

socket.on("update", (msg) => {
  const d = msg.data;
  voltageEl.textContent = `${d.voltage.toFixed(2)} V`;
  currentEl.textContent = `${d.current.toFixed(2)} A`;
  powerEl.textContent = `${d.power.toFixed(2)} W`;
  trendEl.textContent = msg.trend;

  chartData.labels.push("");
  chartData.datasets[0].data.push(d.power);
  if (chartData.labels.length > 20) {
    chartData.labels.shift();
    chartData.datasets[0].data.shift();
  }
  chart.update();
});
