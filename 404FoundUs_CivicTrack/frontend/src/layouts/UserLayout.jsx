import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import UserSidebar from '../features/dashboard/components/UserSidebar';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';

const UserLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">

      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 w-full relative">

        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block lg:w-64 lg:h-[calc(100vh-64px)] lg:sticky lg:top-16 lg:z-30
          ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>

          <div className="p-4 flex items-center justify-between lg:hidden border-b border-gray-50">
            <span className="font-bold text-[#1E3A8A]">Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <UserSidebar closeMobileMenu={() => setIsSidebarOpen(false)} />
        </aside>

        <div
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-hidden">
          <Outlet />
        </main>

      </div>

      <Footer />
    </div>
  );
};

export default UserLayout;