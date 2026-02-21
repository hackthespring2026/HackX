import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GlobalMap from "./pages/GlobalMap";
import CityAnalysis from "./pages/CityAnalysis";
import HealthRisk from "./pages/HealthRisk";
import SafeRoute from "./pages/SafeRoute";
import FutureSimulator from "./pages/FutureSimulator";
import TreeAdvisor from "./pages/TreeAdvisor";
import SchoolSafety from "./pages/SchoolSafety";
import CleanAirChallenge from "./pages/CleanAirChallenge";

// Layout
import Layout from "./components/Layout";

function App() {
  // Check if user is logged in (simple token check)
  const isLoggedIn = () => {
    return localStorage.getItem("token") !== null;
  };

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    return isLoggedIn() ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected pages with sidebar layout */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="map" element={<GlobalMap />} />
          <Route path="city" element={<CityAnalysis />} />
          <Route path="health" element={<HealthRisk />} />
          <Route path="routes" element={<SafeRoute />} />
          <Route path="simulator" element={<FutureSimulator />} />
          <Route path="trees" element={<TreeAdvisor />} />
          <Route path="schools" element={<SchoolSafety />} />
          <Route path="challenge" element={<CleanAirChallenge />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
