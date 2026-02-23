import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import apiClient from '../api/client'

// Menu Items Database
const MENU_ITEMS = [
  { id: 1, name: 'Coffee', price: 3.50, emoji: '☕', color: 'from-amber-400 to-amber-600' },
  { id: 2, name: 'Espresso', price: 4.00, emoji: '🫗', color: 'from-amber-600 to-amber-800' },
  { id: 3, name: 'Burger', price: 8.50, emoji: '🍔', color: 'from-orange-400 to-red-500' },
  { id: 4, name: 'Fries', price: 4.00, emoji: '🍟', color: 'from-yellow-400 to-orange-500' },
  { id: 5, name: 'Salad', price: 6.50, emoji: '🥗', color: 'from-green-400 to-green-600' },
  { id: 6, name: 'Sandwich', price: 7.00, emoji: '🥪', color: 'from-orange-300 to-orange-500' },
  { id: 7, name: 'Pasta', price: 9.50, emoji: '🍝', color: 'from-red-400 to-red-600' },
  { id: 8, name: 'Cake', price: 5.50, emoji: '🍰', color: 'from-pink-400 to-pink-600' },
  { id: 9, name: 'Juice', price: 3.50, emoji: '🧃', color: 'from-yellow-300 to-orange-400' },
  { id: 10, name: 'Donut', price: 2.50, emoji: '🍩', color: 'from-pink-300 to-pink-500' },
]

export default function EmployeeDashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  const handleAddToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now() + Math.random() }])
  }

  const handleRemoveFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId))
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0)

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty!')
      setTimeout(() => setError(''), 3000)
      return
    }

    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const response = await apiClient.post('/logs', {
        action: 'Sale Completed',
        user_id: user?.userId,
        transaction_amount: totalAmount
      })

      if (response.data) {
        setSuccessMessage(`✓ Checkout successful! Amount: $${totalAmount.toFixed(2)}`)
        setCart([])
        setTimeout(() => setSuccessMessage(''), 4000)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
    >
      {/* Sidebar (fixed) */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg p-6">
        <div>
          <h2 className="text-xl font-bold">POS Terminal</h2>
          <p className="text-gray-300 text-sm mt-1">Employee Console</p>
        </div>

        <div className="mt-6 text-sm text-gray-400">{user?.username}</div>

        <div className="mt-auto absolute bottom-6 left-6 right-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full text-red-500 border border-red-200 hover:bg-red-500 hover:text-white transition-all py-2 px-4 rounded-lg"
          >
            Logout
          </motion.button>
        </div>
      </aside>

      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-slate-800 to-purple-800 backdrop-blur-md bg-opacity-80 border-b border-purple-500/30 sticky top-0 z-50 ml-64"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div whileHover={{ scale: 1.05 }}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              🏪 POS Terminal
            </h1>
          </motion.div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-400">Cashier</p>
              <p className="font-semibold text-white">{user?.username}</p>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 py-8 ml-64">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Section */}
          <motion.div
            className="lg:col-span-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800 to-slate-700 backdrop-blur-sm bg-opacity-50 rounded-2xl border border-purple-500/20 p-6 shadow-2xl"
              variants={itemVariants}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📋</span> Menu Items
              </h2>

              {error && !successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
                >
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}

              <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {MENU_ITEMS.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleAddToCart(item)}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className={`bg-gradient-to-br ${item.color} p-3 rounded-xl shadow-lg backdrop-blur-sm border border-white/10 hover:border-white/30 transition group cursor-pointer`}
                  >
                    <div className="text-3xl mb-2">{item.emoji}</div>
                    <div className="text-white font-semibold text-sm">{item.name}</div>
                    <div className="text-white/90 text-xs font-bold">${item.price.toFixed(2)}</div>
                    <div className="text-white/60 text-xs mt-1 group-hover:text-white/100 transition">
                      + Add
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Cart Section */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div className="bg-gradient-to-br from-purple-900 to-slate-800 backdrop-blur-sm bg-opacity-70 rounded-2xl border border-purple-400/30 p-6 shadow-2xl sticky top-24">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <span>🛒</span> Cart
              </h2>

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg"
                >
                  <p className="text-green-300 text-sm font-semibold">{successMessage}</p>
                </motion.div>
              )}

              {/* Cart Items */}
              <motion.div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {cart.length > 0 ? (
                  cart.map((item, idx) => (
                    <motion.div
                      key={item.cartId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between bg-slate-700/50 backdrop-blur-sm p-3 rounded-lg border border-purple-400/20 hover:border-purple-400/50 transition"
                    >
                      <div>
                        <p className="text-white font-semibold text-sm">{item.emoji} {item.name}</p>
                        <p className="text-purple-300 text-xs">${item.price.toFixed(2)}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveFromCart(item.cartId)}
                        className="text-red-400 hover:text-red-300 font-bold text-lg transition"
                      >
                        ✕
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <p className="text-gray-400 text-sm">Cart is empty</p>
                  </motion.div>
                )}
              </motion.div>

              {/* Divider */}
              <div className="border-t border-purple-400/30 my-4"></div>

              {/* Total */}
              <motion.div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Subtotal</span>
                  <span className="text-white font-semibold">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300">Tax (0%)</span>
                  <span className="text-white font-semibold">$0.00</span>
                </div>
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-white font-bold text-2xl">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Checkout Button */}
              <motion.button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                whileHover={cart.length > 0 ? { scale: 1.05 } : {}}
                whileTap={cart.length > 0 ? { scale: 0.95 } : {}}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition shadow-lg ${
                  loading || cart.length === 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin">⟳</span>
                    Processing...
                  </span>
                ) : (
                  <span>🔓 Checkout & Open Drawer</span>
                )}
              </motion.button>

              {/* Item Count */}
              {cart.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-center text-sm text-gray-400"
                >
                  {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Stats Cards */}
        {cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 backdrop-blur-sm bg-opacity-50 rounded-xl border border-purple-500/20 p-6 shadow-lg"
            >
              <p className="text-gray-400 text-sm mb-2">Items</p>
              <p className="text-4xl font-bold text-cyan-400">{cart.length}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 backdrop-blur-sm bg-opacity-50 rounded-xl border border-purple-500/20 p-6 shadow-lg"
            >
              <p className="text-gray-400 text-sm mb-2">Total</p>
              <p className="text-4xl font-bold text-green-400">${totalAmount.toFixed(2)}</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 backdrop-blur-sm bg-opacity-50 rounded-xl border border-purple-500/20 p-6 shadow-lg"
            >
              <p className="text-gray-400 text-sm mb-2">Avg Item</p>
              <p className="text-4xl font-bold text-blue-400">
                ${(totalAmount / cart.length).toFixed(2)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </main>
    </motion.div>
  )
}
