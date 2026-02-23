# POS Anomaly Detection System - React Frontend

A professional Role-Based Access Control (RBAC) dashboard built with React, Vite, React Router, and Tailwind CSS.

## Project Structure

```
Frontend_Spark/
├── src/
│   ├── api/
│   │   └── client.js          # Axios API client with base configuration
│   ├── components/
│   │   └── ProtectedRoute.jsx  # Route protection based on user role
│   ├── pages/
│   │   ├── Login.jsx           # Authentication page
│   │   ├── AdminDashboard.jsx  # Admin panel with user management
│   │   └── EmployeeDashboard.jsx # Employee POS interface
│   ├── App.jsx                 # Main app with routing
│   ├── main.jsx                # React entry point
│   └── index.css               # Tailwind CSS imports
├── index.html                  # HTML template
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
└── package.json                # Project dependencies
```

## Installation

### Prerequisites
- Node.js 16+ and npm

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

3. **Backend must be running:**
   Ensure the FastAPI backend is running on `http://localhost:8000`:
   ```bash
   # In the same directory
   python main.py
   ```

## Features

### 🔐 Authentication & Authorization
- Login page with credentials validation against backend
- Role-based access control (admin/employee)
- Protected routes that redirect unauthorized users
- User session management via localStorage
- Auto-logout on 401 Unauthorized responses

### 👨‍💼 Admin Dashboard
**User Management Tab:**
- View all users in a professional table
- Create new employees with username, password, and role
- Real-time user list updates after creating new users

**Security Feed Tab:**
- Live YOLO video feed display (streams from backend)
- Security alerts and system status monitoring
- System health indicators

### 💰 Employee Dashboard
- Clean POS interface with prominent drawer control
- "Open Cash Drawer (Simulate Sale)" button
- Transaction history table showing all logged actions
- Auto-refresh logs every 5 seconds
- Transaction metrics and statistics

## API Integration

All API calls use the centralized Axios client in [src/api/client.js](src/api/client.js):

### Login
```javascript
POST /login
{
  "username": "admin",
  "password": "admin123"
}
Response: { status: "success", role: "admin", user_id: "abc123" }
```

### User Management
```javascript
GET /users
// Returns: [{ id: "...", username: "...", role: "..." }]

POST /users
{
  "username": "john",
  "password": "pass123",
  "role": "employee"
}
```

### Logs
```javascript
GET /logs
// Returns: [{ id: "...", action: "...", user_id: "...", timestamp: "..." }]

POST /logs
{
  "action": "Drawer Opened",
  "user_id": "123"
}
```

## Component Details

### App.jsx
- Manages global user state and localStorage
- Sets up React Router with protected routes
- Handles login/logout flows
- Auto-redirects to dashboard based on user role

### Login.jsx
- Form validation with error handling
- Displays API error messages
- Demonstrates demo credentials
- Auto-redirects on successful login

### AdminDashboard.jsx
- Two-tab interface: User Management & Security Feed
- Fetches users on mount
- Real-time form submission for creating users
- Video feed integration
- Alert display with status indicators

### EmployeeDashboard.jsx
- Prominent cash drawer simulation button
- Real-time log fetching (5-second intervals)
- Reverses logs to show newest first
- Statistics cards showing transaction count
- Responsive design for mobile/tablet use

### ProtectedRoute.jsx
- Checks localStorage for user authentication
- Validates required user role
- Redirects unauthorized users to login or dashboard

### client.js (API Configuration)
- Centralized Axios instance with base URL
- Request/response interceptors
- Automatic 401 error handling
- CORS support for cross-origin requests

## State Management

All state is managed at the page/component level using React hooks (`useState`, `useEffect`).

- **User Session**: Stored in localStorage (`user`, `userRole`, `userId`)
- **Form State**: Local component state for controlled inputs
- **Data State**: API responses stored in component state with loading/error handling

## Styling

Tailwind CSS is used for all styling:
- Responsive design (mobile-first)
- Professional color scheme
- Consistent spacing and typography
- Reusable component patterns

## Error Handling

- API errors displayed in user-friendly alert messages
- Network errors caught and logged to console
- Invalid credentials shown with specific error text
- Failed operations prevent state mutations

## Production Build

```bash
npm run build
```

This generates an optimized build in the `dist/` folder ready for deployment.

## Demo Credentials

Default admin user:
```
Username: admin
Password: admin123
Role: admin
```

Create additional users through the admin dashboard.

## Troubleshooting

**Cannot connect to backend:**
- Verify FastAPI is running on `http://localhost:8000`
- Check CORS is enabled in backend (it is by default)
- Ensure no port conflicts

**White screen on load:**
- Check browser console for errors
- Verify Node dependencies are installed (`npm install`)
- Clear localStorage and refresh page

**Protected routes not working:**
- Check localStorage for `user`, `userRole`, `userId` keys
- Verify backend login returns correct `role` value
- Check JavaScript console for warning messages

## Browser Support

Works in all modern browsers supporting ES6+:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Development

Hot Module Replacement (HMR) is enabled - changes auto-refresh in the browser during development.

```bash
npm run dev
```

## Build for Production

```bash
npm run build
npm run preview  # Test production build locally
```

## Future Enhancements

- JWT token-based authentication
- User logout functionality
- Role-based feature visibility
- Responsive mobile design improvements
- Error boundary wrapper component
- Redux/Zustand for state management at scale
- E2E testing with Playwright/Cypress
