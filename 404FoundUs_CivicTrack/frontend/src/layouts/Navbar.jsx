import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect } from 'react';
import { Menu, X, MapPin, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ onMenuClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const token = localStorage.getItem("access");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("Invalid token");
      }
    }
  }, []);



  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-[#0F5C86] rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">CivicTrack</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">

            {isDashboard ? (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900/80 leading-none capitalize">{ user?.username }</p>
                  </div>
                  <div className=" w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-[#0F5C86] font-bold border border-blue-200 shadow-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                </div>

              </div>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="bg-[#1E3A8A] text-white px-5 py-2 rounded-full font-medium hover:bg-[#152C6F] transition-colors shadow-lg shadow-blue-900/20"
                >
                  Get Started
                </Link>
              </>
            )}

          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={isDashboard ? onMenuClick : () => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && !isDashboard && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <Link to="/login" className="block px-3 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg">Sign In</Link>
            <Link to="/dashboard" className="block w-full text-center mt-2 bg-[#1E3A8A] text-white px-3 py-3 rounded-lg font-bold shadow-md">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;