# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import time

# app = Flask(__name__)
# CORS(app)

# latest_alert = None

# @app.route("/alert", methods=["POST"])
# def receive_alert():
#     global latest_alert
#     data = request.json
#     latest_alert = {
#         "type": data.get("type"),
#         "timestamp": time.time(),
#         "details": data.get("details", {})
#     }
#     print("🚨 Alert Received:", latest_alert)
#     return jsonify({"status": "ok"})

# @app.route("/latest_alert", methods=["GET"])
# def get_latest_alert():
#     if latest_alert:
#         return jsonify(latest_alert)
#     return jsonify({"status": "no_alert"})

# if __name__ == "__main__":
#     app.run(host="0.0.0.0", port=5000, debug=True)

from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

latest_alert = None
last_alert_time = 0

@app.route("/alert", methods=["POST"])
def receive_alert():
    global latest_alert, last_alert_time
    data = request.json
    latest_alert = {
        "type": data.get("type", "SUSPICIOUS_ACTIVITY"),
        "timestamp": time.time(),
        "details": data.get("details", {})
    }
    last_alert_time = latest_alert["timestamp"]
    print("🚨 Alert Received:", latest_alert)
    return jsonify({"status": "ok"})

@app.route("/status", methods=["GET"])
def status():
    # Show alert for last 5 seconds
    if time.time() - last_alert_time < 5:
        return jsonify({"alert": True, "message": "Suspicious activity found"})
    return jsonify({"alert": False, "message": "All clear"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)