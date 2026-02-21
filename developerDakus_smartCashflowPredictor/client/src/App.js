import React from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import CustomCursor from "./components/cursor/CustomCursor";
import Landing from "./pages/Landing";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <div className="app-shell">
      {/* Custom cursor (hidden on touch devices via CSS) */}
      <CustomCursor />

      {/* Background mesh + floating orbs */}
      <div className="bg-mesh" aria-hidden="true" />
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
      <div className="orb orb-3" aria-hidden="true" />

      <Navbar />

      <div className="page-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
