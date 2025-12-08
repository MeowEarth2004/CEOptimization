# ===== CONFIG =====
$ngrokPath = "C:\Users\party\Desktop\CEOptimization\ngrok-v3-stable-windows-amd64\ngrok.exe"
$pythonPath = "python"

# ===== START FLASK =====
Start-Process -NoNewWindow -FilePath $pythonPath -ArgumentList "C:\Users\party\Desktop\CEOptimization\main.py"
Start-Sleep -Seconds 5

# ===== START NGROK =====
Start-Process -NoNewWindow -FilePath $ngrokPath -ArgumentList "http 5500"
