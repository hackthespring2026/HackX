#!/bin/bash

# ==========================================
# GEC Sentinel — Full System Startup Script
# ==========================================

echo "🚀 Starting GEC Sentinel Full Stack..."

# 1. Kill any existing instances to avoid port conflicts
echo "🧹 Cleaning up old processes..."
pkill -f "runserver 8000"
pkill -f "ai_monitor.py"

# 2. Start Django Backend
echo "⚙️  Starting Django Backend Database & API..."
cd backend
source venv/bin/activate
nohup python manage.py runserver 0.0.0.0:8000 --noreload > ../backend_server.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "   ✅ Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

# Wait for backend to be ready
sleep 3

# 3. Start AI Trajectory Monitor (YOLO best.pt)
echo "👁️  Starting AI Trajectory Monitor (YOLO best.pt)..."
source backend/venv/bin/activate
nohup python ai_monitor.py > ai_monitor.log 2>&1 &
AI_PID=$!
echo "   ✅ AI Monitor running in background (PID: $AI_PID)"

# 4. Open Frontends in Browser
echo "🌐 Opening Dashboards..."
if command -v xdg-open > /dev/null; then
    xdg-open "admin-frontend/admin-dashboard-v2.html"
    xdg-open "cashier-frontend/cashier-pos v2.html"
elif command -v open > /dev/null; then
    open "admin-frontend/admin-dashboard-v2.html"
    open "cashier-frontend/cashier-pos v2.html"
else
    echo "   ⚠️  Could not open browser automatically."
    echo "   Please open these files manually:"
    echo "   - file://$(pwd)/admin-frontend/admin-dashboard-v2.html"
    echo "   - file://$(pwd)/cashier-frontend/cashier-pos v2.html"
fi

echo ""
echo "=========================================="
echo "🎉 SYSTEM FULLY OPERATIONAL 🎉"
echo "=========================================="
echo "To stop the system, run:"
echo "  pkill -f 'runserver 8000' && pkill -f ai_monitor.py"
echo "=========================================="
