import { jwtDecode } from "jwt-decode";
import React ,{useState,useEffect} from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, MapPin, Settings, User, LogOut } from 'lucide-react';
import axios from "axios";

const UserSidebar = ({ closeMobileMenu }) => {
  const [user, setUser] = useState(null);
  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: FileText, label: 'Report Issue', path: '/dashboard/report' },
  ];

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
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-100 block lg:hidden space-y-1">
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-[#1E3A8A] font-bold shadow-sm">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm capitalize font-bold text-gray-900 leading-none">{user?.username}</h3>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">{user?.email}</p>
          </div>
        </div>
        <Link
          to="/logout"
          onClick={closeMobileMenu}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={closeMobileMenu}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 font-semibold text-sm ${isActive
                ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-900/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-[#1E3A8A]'
              }`
            }
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50 space-y-1">
        <Link
          to="/logout"
          onClick={closeMobileMenu}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default UserSidebar;