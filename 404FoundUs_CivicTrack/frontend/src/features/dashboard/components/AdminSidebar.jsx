import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
    FileText,
    Users,
    Settings,
    ShieldCheck,
    LogOut,
    LayoutDashboard,
    BarChart3
} from 'lucide-react';

const AdminSidebar = ({ closeMobileMenu }) => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    ];

    return (
        <div className="h-full flex flex-col bg-white">

            <div className="p-8 hidden lg:block">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 leading-none">Admin Panel</h3>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium italic">Municipal Control</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={closeMobileMenu}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${isActive
                                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                            }`
                        }
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-50 space-y-1">
                <Link
                    to="/logout"
                    className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </Link>
            </div>
        </div>
    );
};

export default AdminSidebar;
