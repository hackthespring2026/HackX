import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FiMap, FiActivity, FiHeart, FiNavigation, FiTrendingUp,
  FiSun, FiBook, FiAward, FiGrid, FiLogOut, FiMenu, FiX, FiWind,
} from "react-icons/fi";

// Sidebar navigation links
const navLinks = [
  { to: "/app", label: "Dashboard", icon: FiGrid, end: true },
  { to: "/app/map", label: "Global AQI Map", icon: FiMap },
  { to: "/app/city", label: "City Analysis", icon: FiActivity },
  { to: "/app/health", label: "Health Risk AI", icon: FiHeart },
  { to: "/app/routes", label: "Safe Routes", icon: FiNavigation },
  { to: "/app/simulator", label: "Future Simulator", icon: FiTrendingUp },
  { to: "/app/trees", label: "Tree Advisor", icon: FiSun },
  { to: "/app/schools", label: "School Safety", icon: FiBook },
  { to: "/app/challenge", label: "Clean Air Challenge", icon: FiAward },
];

function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get logged in user's name
  const user = JSON.parse(localStorage.getItem("user") || '{"name":"User"}');

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#020817" }}>
      {/* ── Sidebar ── */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} flex-shrink-0 transition-all duration-300 flex flex-col`}
        style={{
          background: "rgba(10, 22, 40, 0.95)",
          borderRight: "1px solid rgba(59,130,246,0.15)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-blue-900/30">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
            >
              <FiWind className="text-white text-lg" />
            </div>
            {sidebarOpen && (
              <span className="font-display font-bold text-white text-lg">AirGuard</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1"
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              {sidebarOpen && <span className="font-body">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-blue-900/30">
          {sidebarOpen && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #0ea5e9)" }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{user.name}</p>
                <p className="text-gray-500 text-xs">Monitoring Active</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 w-full text-sm transition-all"
          >
            <FiLogOut className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
