import numpy as np
from sklearn.linear_model import LinearRegression

def predict_energy_trend(power_data):
    if len(power_data) < 5:
        return "Collecting data..."
    X = np.arange(len(power_data)).reshape(-1, 1)
    y = np.array(power_data)
    model = LinearRegression()
    model.fit(X, y)
    slope = model.coef_[0]
    if slope > 0.5:
        return "⚠️ Increasing usage"
    elif slope < -0.5:
        return "✅ Decreasing usage"
    else:
        return "Stable"
