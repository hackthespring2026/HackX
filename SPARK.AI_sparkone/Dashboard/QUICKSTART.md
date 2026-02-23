# Quick Start Guide - POS Anomaly Detection System

## 🚀 Get Started in 2 Minutes

### Step 1: Start Backend (FastAPI)

```bash
cd /home/nirmalya/Desktop/Frontend_Spark

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

✅ Backend running at: **http://localhost:8000**

API Documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Step 2: Start Frontend (React + Vite)

Open a **new terminal** in the same directory:

```bash
# Install Node dependencies
npm install

# Start development server
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

### Step 3: Login

1. Open http://localhost:5173 in your browser
2. Use demo credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. You'll be redirected to the Admin Dashboard

## 📋 What You Can Do

### As Admin
- **User Management**: View all users and create new employees
- **Security Feed**: View live video feed and system alerts
- Navigate between User Management and Security Feed tabs

### As Employee
- **Cash Drawer Control**: Click "Open Cash Drawer (Simulate Sale)" button
- **Transaction History**: See all your logged transactions
- Logs auto-refresh every 5 seconds

## 📁 Project Files Overview

### Backend (Python)
- `main.py` - FastAPI application with all endpoints
- `requirements.txt` - Python dependencies (FastAPI, Uvicorn, Pydantic)
- `db.json` - Local JSON database (auto-created with default admin)

### Frontend (React)
- `package.json` - Node dependencies
- `src/App.jsx` - Main routing and state management
- `src/pages/Login.jsx` - Login page
- `src/pages/AdminDashboard.jsx` - Admin panel
- `src/pages/EmployeeDashboard.jsx` - Employee POS interface
- `src/api/client.js` - Axios API client
- `src/components/ProtectedRoute.jsx` - Route protection logic

### Configuration
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS setup
- `postcss.config.js` - PostCSS plugins

## 🔑 Key Features

✅ **Dynamic Data** - No hardcoded data, everything from API
✅ **Role-Based Access** - Admin and Employee roles with protected routes
✅ **Real-time Updates** - Logs refresh automatically
✅ **Professional UI** - Tailwind CSS styling
✅ **Error Handling** - User-friendly error messages
✅ **LocalStorage Session** - Persist login across page refresh
✅ **CORS Support** - Frontend-backend communication enabled

## 🧪 Testing the API

### Create a New Employee

```bash
curl -X POST "http://localhost:8000/users" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "pass123",
    "role": "employee"
  }'
```

### Log a Transaction

```bash
curl -X POST "http://localhost:8000/logs" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "Sale Completed",
    "user_id": "admin-001"
  }'
```

### Get All Users

```bash
curl "http://localhost:8000/users"
```

### Get All Logs

```bash
curl "http://localhost:8000/logs"
```

## 📊 Database Structure

The system uses a local `db.json` file with this structure:

```json
{
  "users": [
    {
      "id": "abc12345",
      "username": "admin",
      "password": "admin123",
      "role": "admin"
    }
  ],
  "pos_logs": [
    {
      "id": "LOG00001",
      "action": "Drawer Opened",
      "user_id": "abc12345",
      "timestamp": "2026-02-20T10:30:00.000000"
    }
  ]
}
```

## 🛠️ Build for Production

### Backend
```bash
# No build needed - just run with Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

### Frontend
```bash
npm run build
# Creates optimized build in `dist/` folder
# Deploy to any static host (Vercel, Netlify, etc.)
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Check Python version (3.8+), verify port 8000 is free |
| **Frontend won't load** | Run `npm install`, check node version (16+) |
| **Can't login** | Verify backend is running, use admin/admin123 credentials |
| **CORS errors** | Backend CORS is already enabled - shouldn't happen |
| **Logs not updating** | Refresh page, check browser console for errors |

## 📚 Learn More

- **Backend Docs**: See [README.md](README.md) for backend details
- **Frontend Docs**: See [FRONTEND_README.md](FRONTEND_README.md) for frontend details
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/

## ✨ Next Steps

1. ✅ Create more user accounts through admin dashboard
2. ✅ Simulate transactions from employee dashboard
3. ✅ Check live logs in real-time
4. ✅ Explore API endpoints via Swagger UI
5. ✅ Customize styling with Tailwind CSS
6. ✅ Deploy to production when ready

## 🎯 Demo Workflow

1. **Login** as admin (admin/admin123)
2. Go to **User Management** tab
3. **Create a new employee** (e.g., username="emp1", password="pass123", role="employee")
4. **Login** in another tab with new employee credentials
5. On employee dashboard, click **"Open Cash Drawer"** button
6. **Check admin dashboard** - Security Feed placeholder ready for video integration
7. Go back to employee dashboard - see **transaction logged** in table

---

**Happy coding! 🚀**

For support or questions, refer to the detailed README files in the project.
