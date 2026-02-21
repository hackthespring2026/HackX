"""
AirGuard ML Training Script
============================
Models used:
1. Random Forest – AQI prediction from pollution features
2. Linear Regression – 5-year trend forecasting
3. K-Means Clustering – Zone risk classification
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# Create models directory
os.makedirs("models", exist_ok=True)

print("🌿 AirGuard ML Training Started...\n")

# ─────────────────────────────────────────────
# 1. Generate Sample Dataset
# ─────────────────────────────────────────────
np.random.seed(42)
n = 2000  # number of samples

data = {
    # Input features
    "pm25": np.random.exponential(30, n),           # PM2.5 µg/m³
    "pm10": np.random.exponential(60, n),            # PM10 µg/m³
    "no2": np.random.exponential(40, n),             # NO2 µg/m³
    "so2": np.random.exponential(20, n),             # SO2 µg/m³
    "co": np.random.exponential(0.5, n),             # CO ppm
    "o3": np.random.exponential(50, n),              # Ozone µg/m³
    "temperature": np.random.normal(25, 10, n),      # °C
    "humidity": np.random.uniform(20, 95, n),        # %
    "wind_speed": np.random.exponential(5, n),       # km/h
    "traffic_volume": np.random.randint(100, 5000, n),  # vehicles/hour
    "hour_of_day": np.random.randint(0, 24, n),      # 0-23
    "day_of_week": np.random.randint(0, 7, n),       # 0=Monday
    "month": np.random.randint(1, 13, n),            # 1-12
    "industrial_score": np.random.uniform(0, 10, n), # 0-10 scale
}

df = pd.DataFrame(data)

# Create AQI as a function of these features (realistic formula)
df["aqi"] = (
    df["pm25"] * 0.8 +
    df["pm10"] * 0.3 +
    df["no2"] * 0.5 +
    df["so2"] * 0.4 +
    df["co"] * 10 +
    df["traffic_volume"] * 0.02 +
    df["industrial_score"] * 8 -
    df["wind_speed"] * 3 +
    np.random.normal(0, 5, n)  # noise
).clip(0, 500)

# Save dataset for reference
df.to_csv("data/training_data.csv", index=False)
print(f"✅ Dataset created: {len(df)} samples")
print(f"   AQI range: {df['aqi'].min():.1f} – {df['aqi'].max():.1f}")
print(f"   Average AQI: {df['aqi'].mean():.1f}\n")

# ─────────────────────────────────────────────
# 2. Random Forest – AQI Predictor
# ─────────────────────────────────────────────
print("🌲 Training Random Forest (AQI Predictor)...")

features = ["pm25", "pm10", "no2", "so2", "co", "o3", "temperature",
            "humidity", "wind_speed", "traffic_volume", "industrial_score"]

X = df[features]
y = df["aqi"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf_model = RandomForestRegressor(
    n_estimators=100,       # 100 trees
    max_depth=15,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1               # use all CPU cores
)
rf_model.fit(X_train, y_train)

# Evaluate
y_pred = rf_model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"   MAE: {mae:.2f} | R² Score: {r2:.4f}")

# Save model
joblib.dump(rf_model, "models/aqi_random_forest.pkl")
joblib.dump(features, "models/feature_names.pkl")
print("   ✅ Saved: models/aqi_random_forest.pkl\n")

# ─────────────────────────────────────────────
# 3. Linear Regression – 5-Year Forecast
# ─────────────────────────────────────────────
print("📈 Training Linear Regression (5-Year Forecast)...")

# Generate time-series like data for forecasting
years = np.arange(2015, 2025).reshape(-1, 1)
base_aqi = 150  # Delhi-like baseline

# Simulated historical data with a slight improvement trend
historical_aqi = base_aqi + np.array([25, 22, 18, 15, 10, 5, 0, -3, -8, -12]) + np.random.normal(0, 3, 10)

lr_model = LinearRegression()
lr_model.fit(years, historical_aqi)

# Evaluate
lr_pred = lr_model.predict(years)
print(f"   R² Score: {r2_score(historical_aqi, lr_pred):.4f}")
print(f"   Trend: AQI changes by {lr_model.coef_[0]:.2f} per year")

# Save model
joblib.dump(lr_model, "models/aqi_forecast_lr.pkl")
print("   ✅ Saved: models/aqi_forecast_lr.pkl\n")

# ─────────────────────────────────────────────
# 4. K-Means – Zone Risk Classification
# ─────────────────────────────────────────────
print("🗺️  Training K-Means (Zone Classifier)...")

# Features for zone clustering
zone_features = ["pm25", "pm10", "industrial_score", "traffic_volume"]
scaler = StandardScaler()
X_zone = scaler.fit_transform(df[zone_features])

# 3 clusters: Safe, Moderate, Dangerous
kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
kmeans.fit(X_zone)

# Map cluster numbers to risk labels based on AQI
cluster_aqi = df.copy()
cluster_aqi["cluster"] = kmeans.labels_
cluster_means = cluster_aqi.groupby("cluster")["aqi"].mean()

# Sort clusters by AQI mean
sorted_clusters = cluster_means.sort_values()
risk_map = {
    sorted_clusters.index[0]: "Safe Zone",
    sorted_clusters.index[1]: "Moderate Zone",
    sorted_clusters.index[2]: "Danger Zone",
}
print(f"   Clusters: {risk_map}")

# Save models
joblib.dump(kmeans, "models/zone_kmeans.pkl")
joblib.dump(scaler, "models/zone_scaler.pkl")
joblib.dump(risk_map, "models/zone_risk_map.pkl")
print("   ✅ Saved: models/zone_*.pkl\n")

# ─────────────────────────────────────────────
# 5. Feature Importance Report
# ─────────────────────────────────────────────
print("📊 Feature Importance (Random Forest):")
importance_df = pd.DataFrame({
    "Feature": features,
    "Importance": rf_model.feature_importances_
}).sort_values("Importance", ascending=False)

for _, row in importance_df.iterrows():
    bar = "█" * int(row["Importance"] * 50)
    print(f"   {row['Feature']:20s} {bar} {row['Importance']:.3f}")

print("\n✅ All models trained and saved successfully!")
print("🚀 Start the API server with: python api_server.py")
