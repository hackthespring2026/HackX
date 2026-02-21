import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar from './layouts/Navbar';
import Footer from './layouts/Footer';
import UserLayout from './layouts/UserLayout';
import Loader from './components/feedback/Loader';
import PrivateRoute from "./components/PrivateRoute";

const Home = lazy(() => import('./pages/public/Home'));
const Login = lazy(() => import('./pages/public/Login'));
const Signup = lazy(() => import('./pages/public/Signup'));
const Dashboard = lazy(() => import('./pages/user/Dashboard'));
const ReportIssue = lazy(() => import('./pages/user/ReportIssue'));
const ComplaintDetail = lazy(() => import('./pages/user/ComplaintDetail'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const Logout = lazy(() => import('./pages/public/Logout'));
const AdminComplaintDetail = lazy(() => import('./pages/admin/ComplaintDetail'));

const RootLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <main className="flex-grow font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>

          <Route path="/" element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>

          <Route element={<PrivateRoute allowedRole="CITIZEN" />}>
            <Route path="/dashboard" element={<UserLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="report" element={<ReportIssue />} />
              <Route path="complaint/:id" element={<ComplaintDetail />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute allowedRole="AUTHORITY" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="complaint/:id" element={<AdminComplaintDetail />} />
            </Route>
          </Route>

          <Route path="/logout" element={<Logout />} />

        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;