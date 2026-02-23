import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import apiClient from '../api/client'

// Inventory Items (matching POS menu)
const INVENTORY_ITEMS = [
  { id: 1, name: 'Coffee', sku: 'BVRG-001', stock: 45, capacity: 50, emoji: '☕' },
  { id: 2, name: 'Espresso', sku: 'BVRG-002', stock: 38, capacity: 50, emoji: '🫗' },
  { id: 3, name: 'Burger', sku: 'FOOD-001', stock: 12, capacity: 30, emoji: '🍔' },
  { id: 4, name: 'Fries', sku: 'FOOD-002', stock: 28, capacity: 50, emoji: '🍟' },
  { id: 5, name: 'Salad', sku: 'FOOD-003', stock: 15, capacity: 25, emoji: '🥗' },
  { id: 6, name: 'Sandwich', sku: 'FOOD-004', stock: 8, capacity: 20, emoji: '🥪' },
  { id: 7, name: 'Pasta', sku: 'FOOD-005', stock: 22, capacity: 35, emoji: '🍝' },
  { id: 8, name: 'Cake', sku: 'DSRT-001', stock: 10, capacity: 20, emoji: '🍰' },
  { id: 9, name: 'Juice', sku: 'BVRG-003', stock: 40, capacity: 50, emoji: '🧃' },
  { id: 10, name: 'Donut', sku: 'DSRT-002', stock: 35, capacity: 60, emoji: '🍩' },
]

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('security') // Default to security for your pitch!
  const [users, setUsers] = useState([])
  const [analyticsData, setAnalyticsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [alerts, setAlerts] = useState([])
  
  // 🔥 Cashier Status State
  const [cashierStatus, setCashierStatus] = useState("SCANNING...")
  const prevAlertId = useRef(null)
  
  // Form state
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'employee',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Fetch users and analytics
  useEffect(() => {
    fetchUsers()
    if (activeTab === 'analytics') {
      fetchAnalytics()
    }
  }, [activeTab])

  // 🔊 Audio Synthesizer for Critical Alerts
  const playBeep = () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.type = 'square'; 
      oscillator.frequency.setValueAtTime(800, context.currentTime); 
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime); 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
      console.log("Audio play blocked by browser until user interacts with the page.");
    }
  };

  // 🛡️ ARMORED ALERTS & CASHIER STATUS FETCH LOGIC
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Alerts
      try {
        const response = await fetch("http://localhost:8000/alerts");
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          if (prevAlertId.current && prevAlertId.current !== data[0].id) {
            playBeep(); // Beep on new alert
          }
          prevAlertId.current = data[0].id;
          setAlerts(data);
        } else if (Array.isArray(data)) {
          setAlerts(data);
        }
      } catch (error) {
        console.error("Failed to fetch alerts", error);
      }

      // 2. Fetch Cashier Status
      try {
        const statusRes = await fetch("http://localhost:8000/get_cashier_status");
        const statusData = await statusRes.json();
        setCashierStatus(statusData.status);
      } catch (error) {
        console.error("Failed to fetch cashier status", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // 2-second refresh for the demo
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/users')
      setUsers(response.data)
    } catch (err) {
      setError('Failed to fetch users')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/analytics')
      const chartData = response.data.map(item => ({
        time: new Date(item.time_interval).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        amount: item.total_amount,
        transactions: item.transaction_count,
        employees: item.employees.length
      }))
      setAnalyticsData(chartData)
    } catch (err) {
      setError('Failed to fetch analytics')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    try {
      await apiClient.post('/users', newUser)
      setNewUser({ username: '', password: '', role: 'employee' })
      await fetchUsers()
      alert('User created successfully!')
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create user')
    } finally {
      setFormLoading(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const filteredInventory = INVENTORY_ITEMS.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  // 🔥 FILTER THE ALERTS FOR THE NEW HARDWARE SQUARE
  const hardwareAlerts = alerts.filter(a => a.type === 'critical_hardware');
  const aiAlerts = alerts.filter(a => a.type !== 'critical_hardware');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg"
      >
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">POS System</h2>
          <p className="text-gray-400 text-sm mt-1">Admin Dashboard</p>
        </div>

        <nav className="mt-8 space-y-2 px-4">
          {[
            { id: 'security', label: 'Security Feed', emoji: '🔒' },
            { id: 'users', label: 'User Management', emoji: '👥' },
            { id: 'inventory', label: 'Inventory', emoji: '📦' },
            { id: 'analytics', label: 'Sales Analytics', emoji: '📊' },
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.emoji} {tab.label}
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <p className="text-sm text-gray-300 mb-2">Logged in as:</p>
          <p className="font-semibold text-white truncate">{user?.username}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full mt-4 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white transition-all py-2 px-4 rounded-lg"
          >
            Logout
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="ml-64 flex-1 overflow-auto">
        <motion.header
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white shadow-sm p-6 border-b border-gray-200 sticky top-0 z-40"
        >
          <h1 className="text-3xl font-bold text-gray-800">
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'inventory' && 'Inventory Management'}
            {activeTab === 'analytics' && 'Sales Analytics'}
            {activeTab === 'security' && 'Security Feed'}
          </h1>
          <p className="text-gray-600 mt-1">
            {activeTab === 'users' && 'Manage system users and roles'}
            {activeTab === 'inventory' && 'Monitor stock levels'}
            {activeTab === 'analytics' && 'View sales performance & trends'}
            {activeTab === 'security' && 'Monitor system activity and alerts'}
          </p>
        </motion.header>

        <div className="p-8">
          
          {/* Security Feed Tab */}
          {activeTab === 'security' && (
            <motion.div variants={tabVariants} initial="hidden" animate="visible" className="space-y-8">
              
              {/* 🔥 NEW: EXCLUSIVE CRITICAL HARDWARE SQUARE 🔥 */}
              {hardwareAlerts.length > 0 && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-600 rounded-lg shadow-2xl overflow-hidden border-4 border-red-800 animate-pulse"
                >
                  <div className="px-6 py-4 bg-red-800 border-b border-red-900 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-white flex items-center">
                      <span className="text-3xl mr-3">🚨</span> CRITICAL HARDWARE PANIC
                    </h2>
                    <span className="text-white font-bold bg-red-600 px-3 py-1 rounded">ESP8266 TRIGGERED</span>
                  </div>
                  <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
                    {hardwareAlerts.slice(0, 4).map((alert) => (
                      <div key={alert.id} className="bg-white p-4 rounded-lg shadow-inner border-l-8 border-red-800 flex flex-col justify-center">
                        <p className="font-black text-red-800 text-lg uppercase">{alert.message}</p>
                        <p className="text-sm text-gray-600 font-bold mt-2">
                          TIME: {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* TRIPLE Video Feed Card */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">📹 Live Multi-Node Security Feed</h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* CAM 1 */}
                  <div className="flex flex-col">
                    <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-t-lg w-max">CAM 1: MAIN POS (YOLO AI)</span>
                    <img 
                      src="http://localhost:8000/video_feed" 
                      alt="Camera 1 AI Stream" 
                      className="w-full aspect-video border-4 border-slate-800 rounded-b-lg rounded-tr-lg shadow-md object-cover bg-gray-200"
                    />
                  </div>
                  
                  {/* 🔥 CAM 2: WITH DYNAMIC STATUS BADGE 🔥 */}
                  <div className="flex flex-col">
                    <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-t-lg w-max">CAM 2: CASHIER AUTH</span>
                    <img 
                      src="http://localhost:8000/video_feed_2" 
                      alt="Camera 2 Face Auth Stream" 
                      className="w-full aspect-video border-x-4 border-t-4 border-slate-800 rounded-tr-lg shadow-md object-cover bg-gray-200"
                    />
                    <div className={`text-center font-black py-2 text-white border-x-4 border-b-4 border-slate-800 rounded-b-lg transition-colors duration-300 ${cashierStatus === 'AUTHORIZED' ? 'bg-green-600' : cashierStatus === 'UNAUTHORIZED' ? 'bg-red-600' : 'bg-yellow-600'}`}>
                      {cashierStatus}
                    </div>
                  </div>

                  {/* CAM 3 */}
                  <div className="flex flex-col">
                    <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-t-lg w-max">CAM 3: NOTE DETECTION</span>
                    <img 
                      src="http://localhost:8000/video_feed_3" 
                      alt="Camera 3 Note Detection Stream" 
                      className="w-full aspect-video border-4 border-slate-800 rounded-b-lg rounded-tr-lg shadow-md object-cover bg-gray-200"
                    />
                  </div>

                </div>
              </div>

              {/* Regular AI Alerts Card */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">🤖 AI Vision Alerts Log</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <span className="text-2xl mr-4">⚠️</span>
                      <div>
                        <p className="font-semibold text-yellow-800">AI Monitoring Active</p>
                        <p className="text-sm text-yellow-700">Real-time edge AI anomaly detection enabled</p>
                      </div>
                    </motion.div>

                    {(!aiAlerts || aiAlerts.length === 0) ? (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <span className="text-2xl mr-4">✅</span>
                        <div>
                          <p className="font-semibold text-green-800">All Nodes Secure</p>
                          <p className="text-sm text-green-700">No AI anomalies detected.</p>
                        </div>
                      </motion.div>
                    ) : (
                      aiAlerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-start p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm"
                        >
                          <span className="text-2xl mr-4">👀</span>
                          <div>
                            <p className="font-bold text-red-800">{alert.message}</p>
                            <p className="text-xs text-red-600 font-semibold mt-1">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                    
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <motion.div variants={tabVariants} initial="hidden" animate="visible" className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">All Users</h2>
                </div>
                {error && (
                  <div className="p-4 bg-red-50 border-b border-red-200">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr><td colSpan="3" className="px-6 py-8 text-center"><span className="text-gray-500">Loading users...</span></td></tr>
                      ) : users && users.length > 0 ? (
                        users.map((u) => (
                          <motion.tr key={u.id} whileHover={{ backgroundColor: 'rgba(0,0,0,0.01)' }} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{u.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                {u.role}
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" className="px-6 py-8 text-center"><span className="text-gray-500">No users found</span></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Employee</h2>
                {formError && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{formError}</p></div>}
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} placeholder="Enter username" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Enter password" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={formLoading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg transition">
                    {formLoading ? 'Creating...' : 'Create User'}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <motion.div variants={tabVariants} initial="hidden" animate="visible" className="space-y-8">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-lg shadow-lg p-6">
                <div className="relative">
                  <input type="text" placeholder="🔍 Search by item name or SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-6 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition" />
                </div>
              </motion.div>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">📦 Stock Levels ({filteredInventory.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stock Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInventory.map((item) => {
                        const usage = (item.stock / item.capacity) * 100
                        const status = usage > 75 ? 'high' : usage > 50 ? 'medium' : 'low'
                        return (
                          <motion.tr key={item.id} whileHover={{ backgroundColor: 'rgba(0,0,0,0.01)' }} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.emoji} {item.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">{item.sku}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${status === 'high' ? 'bg-red-500' : status === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${usage}%` }}></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{item.stock}/{item.capacity}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'high' ? 'bg-red-100 text-red-800' : status === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {status === 'high' ? '🔴 High' : status === 'medium' ? '🟡 Medium' : '🟢 Low'}
                              </span>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div variants={tabVariants} initial="hidden" animate="visible" className="space-y-8">
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{error}</p></div>}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">📊 Sales Volume (30-minute intervals)</h2>
                {loading ? (
                  <div className="h-96 flex items-center justify-center"><span className="text-gray-500">Loading analytics...</span></div>
                ) : analyticsData && analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmount)" name="Sales Amount ($)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center"><span className="text-gray-500">No data available for today</span></div>
                )}
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">📈 Transaction Count</h2>
                {analyticsData && analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="transactions" fill="#10b981" name="Transactions" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center"><span className="text-gray-500">No transaction data</span></div>
                )}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  )
}