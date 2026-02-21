import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="nav-brand-wrap">
          <div className="brand-mark" aria-hidden="true" />
          <span className="nav-brand">Developer Dakus</span>
        </NavLink>

        {/* Nav links */}
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            Dashboard
          </NavLink>
        </nav>

        {/* Status */}
        
      </div>
    </header>
  );
}

export default Navbar;
