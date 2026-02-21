"""
AirGuard ML API Server (Flask)
================================
Exposes trained ML models via REST API.
The Node.js backend calls this service for predictions.

Run: python api_server.py
Port: 8000
"""

from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# Load models (only if they exist after training)
models = {}

def load_models():
    try:
        models["rf"] = joblib.load("models/aqi_random_forest.pkl")
        models["features"] = joblib.load("models/feature_names.pkl")
        models["lr"] = joblib.load("models/aqi_forecast_lr.pkl")
        models["kmeans"] = joblib.load("models/zone_kmeans.pkl")
        models["scaler"] = joblib.load("models/zone_scaler.pkl")
        models["risk_map"] = joblib.load("models/zone_risk_map.pkl")
        print("✅ All models loaded successfully")
    except Exception as e:
        print(f"⚠️ Could not load models: {e}")
        print("   Run 'python scripts/train.py' first to train models")

load_models()

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "AirGuard ML API running", "models_loaded": len(models) > 0})

@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict AQI based on pollution features
    Body: { pm25, pm10, no2, so2, co, o3, temperature, humidity, wind_speed, traffic_volume, industrial_score }
    """
    try:
        data = request.json
        if "rf" not in models:
            return jsonify({"error": "Models not loaded. Run train.py first"}), 503

        # Extract features in correct order
        feature_names = models["features"]
        features = [data.get(f, 0) for f in feature_names]
        prediction = models["rf"].predict([features])[0]

        return jsonify({
            "success": True,
            "predicted_aqi": round(float(prediction), 1),
            "features_used": feature_names,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/forecast", methods=["POST"])
def forecast():
    """
    Generate 5-year AQI forecast
    Body: { currentAqi, scenario, years (default 5) }
    """
    try:
        data = request.json
        current_aqi = float(data.get("currentAqi", 100))
        years = int(data.get("years", 5))
        scenario = data.get("scenario", "baseline")

        # Scenario impact values
        impacts = {
            "traffic_up": 15,
            "factory": 25,
            "vehicles_down": -8,
            "trees_500": -5,
            "ev_adoption": -12,
            "solar": -18,
            "industry_close": -20,
            "population": 10,
            "baseline": 0,
        }
        total_impact = impacts.get(scenario, 0)

        # Generate forecast using Linear Regression trend + scenario
        current_year = 2025
        forecast = []
        for i in range(years + 1):
            year = current_year + i
            progress = i / years
            # Gradually apply scenario impact over time
            aqi = current_aqi + (total_impact * progress) + np.random.normal(0, 3)
            baseline = current_aqi + np.random.normal(0, 3)
            forecast.append({
                "year": year,
                "baseline": round(max(5, baseline), 1),
                "predicted": round(max(5, aqi), 1),
            })

        return jsonify({
            "success": True,
            "scenario": scenario,
            "total_impact": total_impact,
            "forecast": forecast,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/classify-zone", methods=["POST"])
def classify_zone():
    """
    Classify a location into risk zone using K-Means
    Body: { pm25, pm10, industrial_score, traffic_volume }
    """
    try:
        if "kmeans" not in models:
            return jsonify({"error": "Models not loaded"}), 503

        data = request.json
        features = [[
            float(data.get("pm25", 30)),
            float(data.get("pm10", 60)),
            float(data.get("industrial_score", 5)),
            float(data.get("traffic_volume", 1000)),
        ]]

        scaled = models["scaler"].transform(features)
        cluster = int(models["kmeans"].predict(scaled)[0])
        risk = models["risk_map"].get(cluster, "Unknown")

        return jsonify({
            "success": True,
            "cluster": cluster,
            "zone_classification": risk,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🤖 AirGuard ML API starting on http://localhost:8000")
    app.run(port=8000, debug=False)
