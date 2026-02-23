# POS Anomaly Detection System - Full Stack

A complete Point of Sale (POS) anomaly detection system with:
- **Backend**: FastAPI server with JSON file storage
- **Frontend**: React dashboard with role-based access control (RBAC)

## Quick Start

### 1. Backend Setup (FastAPI)

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The API will be available at `http://localhost:8000`

Interactive API docs:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 2. Frontend Setup (React + Vite)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Default Credentials

```
Username: admin
Password: admin123
Role: admin
```

## Project Structure

```
Frontend_Spark/
├── main.py                    # FastAPI backend
├── requirements.txt           # Python dependencies
├── db.json                    # JSON database (auto-created)
├── package.json               # Node dependencies
├── vite.config.js            # Vite config
├── tailwind.config.js        # Tailwind CSS config
├── index.html                # HTML entry point
└── src/
    ├── App.jsx               # Main app with routing
    ├── pages/
    │   ├── Login.jsx
    │   ├── AdminDashboard.jsx
    │   └── EmployeeDashboard.jsx
    ├── components/
    │   └── ProtectedRoute.jsx
    └── api/
        └── client.js         # Axios client
```

## Backend Features

- **JSON Database**: Lightweight local file storage (db.json)
- **User Management**: Create users and assign roles
- **Authentication**: Login endpoint with credentials validation
- **Activity Logging**: Timestamp-based POS action logging
- **CORS Support**: Enabled for frontend integration
- **Auto-initialization**: Default admin user created on first run

## Backend API Endpoints

### Authentication
- **POST /login** - Login with username and password
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
  Response: `{status: "success", role: "admin", user_id: "abc123"}`

### Users Management
- **GET /users** - Get all users
- **POST /users** - Create a new user
  ```json
  {
    "username": "operator1",
    "password": "secure_password",
    "role": "operator"
  }
  ```

### Logs
- **GET /logs** - Get all POS logs
- **POST /logs** - Create a new log entry
  ```json
  {
    "action": "sale",
    "user_id": "admin-001"
  }
  ```

### Health
- **GET /health** - Service health check
- **GET /** - Root health check

## Database Structure (db.json)

```json
{
  "users": [
    {
      "id": "abc12345",
      "username": "operator1",
    ```
  Response: `{status: "success", role: "admin", user_id: "abc123"}`

### Users Management
- **GET /users** - Get all users
- **POST /users** - Create a new user

### Logs
- **GET /logs** - Get all POS logs
- **POST /logs** - Create a new log entry

### Health
- **GET /health** - Service health check
- **GET /** - Root health check

## Backend Database Structure (db.json)

```json
{
  "users": [
    {
      "id": "abc12345",
      "username": "operator1",
      "password": "password123",
      "role": "operator"
    }
  ],
  "pos_logs": [
    {
      "id": "log000001",
      "action": "Drawer Opened",
      "user_id": "abc12345",
      "timestamp": "2026-02-20T10:30:45.123456"
    }
  ]
}
```

## Backend Helper Functions

- **`read_db()`** - Safely reads and parses db.json
- **`write_db(data)`** - Atomically writes data to db.json with pretty formatting
- **`initialize_db()`** - Creates db.json with default admin user if missing
- **`generate_user_id()`** - Creates unique user IDs
- **`generate_log_id()`** - Creates unique log IDs

## Frontend Features

- **Role-Based Authentication**: Login with redirect to respective dashboard
- **Admin Dashboard**: User management interface with create/view functionality
- **Employee Dashboard**: POS interface with cash drawer simulation
- **Protected Routes**: Unauthorized access blocked
- **Real-time Data**: Logs auto-refresh every 5 seconds
- **Professional UI**: Tailwind CSS with dark theme support
- **Error Handling**: User-friendly error messages

## Frontend Pages

### Login Page
- Username and password form
- Demo credentials display
- Validation and error handling
- Auto-redirect on successful login

### Admin Dashboard
**User Management Tab:**
- Table of all system users
- Create new employee form (username, password, role)
- Real-time user list updates

**Security Feed Tab:**
- Live YOLO video feed display
- Security alerts and status monitors

### Employee Dashboard
- Cash drawer control button
- Transaction history table
- Auto-refreshing logs
- Transaction statistics

## API Integration

Both frontend and backend use a centralized axios client for API calls.

### Frontend Axios Configuration
- Base URL: `http://localhost:8000`
- Auto-unmounts session on 401 (Unauthorized)
- CORS support for cross-origin requests

## Running Both Services

**Terminal 1 - Backend:**
```bash
python main.py
# API available at http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend available at http://localhost:5173
```

## Production Deployment

### Backend
- Use environment variables for sensitive config
- Enable password hashing
- Implement JWT authentication
- Use PostgreSQL or MongoDB instead of JSON
- Deploy with Gunicorn + Nginx

### Frontend
```bash
npm run build
# Deploy the `dist/` folder to a static host (Vercel, Netlify, AWS S3, etc.)
```

## Development Tools

### Backend
- FastAPI with Pydantic validation
- Uvicorn ASGI server
- Swagger UI at `/docs`
- ReDoc at `/redoc`

### Frontend
- Vite for fast development
- React 18 with hooks
- React Router v6 for navigation
- Tailwind CSS for styling
- Axios for HTTP requests

## Security Notes

⚠️ **Development Mode Only**
- Passwords stored in plain text
- No authentication tokens (JWT)
- CORS open to all origins
- Default admin credentials exposed

For production:
- Hash passwords with bcrypt
- Implement JWT or OAuth2
- Restrict CORS to known origins
- Use environment variables for secrets
- Enable HTTPS
- Implement rate limiting
- Add database encryption

## Troubleshooting

**Cannot connect to backend:**
- Verify `python main.py` is running on port 8000
- Check firewall/network settings
- Ensure CORS is enabled in backend

**Frontend won't load:**
- Run `npm install` if missing dependencies
- Check `npm run dev` output for errors
- Clear browser cache and localStorage

**Login fails:**
- Verify credentials are correct (admin/admin123)
- Check backend logs for errors
- Ensure db.json exists and is valid

**CORS errors:**
- Backend CORS is enabled by default
- Verify frontend URL is allowed in `allow_origins`

## Next Steps

1. Create additional user roles (manager, supervisor, etc.)
2. Add JWT authentication tokens
3. Implement password hashing with bcrypt
4. Add database persistence (PostgreSQL)
5. Create more detailed logging and analytics
6. Add real video feed integration
7. Implement machine learning anomaly detection
8. Deploy to production server

## License

MIT License - feel free to use for your POS system!

