'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CreditCard, Lock, CheckCircle, RefreshCw, DollarSign, Clock, AlertCircle, X } from 'lucide-react';

const statusConfig = {
  pending:  { label: 'Pending',  color: 'text-gray-400',   bg: 'bg-gray-500/20' },
  held:     { label: '🔒 In Escrow', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  released: { label: '✅ Released', color: 'text-green-400',  bg: 'bg-green-500/20' },
  refunded: { label: '↩ Refunded', color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  disputed: { label: '⚠ Disputed', color: 'text-red-400',    bg: 'bg-red-500/20' },
};

// Dummy payment modal
function PaymentModal({ application, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=amount, 2=method, 3=confirm, 4=done
  const [amount, setAmount] = useState(application.dealAmount || application.proposedRate || '');
  const [method, setMethod] = useState('card');
  const [cardNum, setCardNum] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Simulate 2 second processing
      await new Promise(r => setTimeout(r, 2000));

      await api.post('/payments/initiate', {
        applicationId: application._id,
        amount: parseInt(amount),
        paymentMethod: {
          type: method,
          last4: method === 'card' ? cardNum.slice(-4) : '',
          upiId: method === 'upi' ? upiId : '',
        }
      });

      setStep(4);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        {/* Step 1: Amount */}
        {step === 1 && (
          <div>
            <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign size={28} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Set Payment Amount</h2>
            <p className="text-gray-400 text-sm mb-6">For: <span className="text-white">{application.creator?.name}</span></p>

            <div className="bg-dark-700 rounded-2xl p-5 mb-5">
              <label className="block text-sm text-gray-400 mb-2">Deal Amount (₹)</label>
              <input
                type="number"
                className="input-field text-2xl font-bold"
                placeholder="₹25,000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              {amount && (
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Platform Fee (10%)</span>
                    <span>- ₹{Math.round(amount * 0.10).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-400 font-semibold">
                    <span>Creator Receives</span>
                    <span>₹{Math.round(amount * 0.90).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-5">
              <div className="flex items-start gap-2">
                <Lock size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-300 text-xs">Amount will be <strong>held in escrow</strong> on our platform. Released to creator only after you verify their content.</p>
              </div>
            </div>

            <button
              disabled={!amount || amount < 100}
              onClick={() => setStep(2)}
              className="btn-primary w-full"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Payment Method</h2>
            <p className="text-gray-400 text-sm mb-6">Choose how to pay ₹{parseInt(amount).toLocaleString()}</p>

            <div className="space-y-3 mb-6">
              {[
                { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
                { id: 'upi', label: 'UPI', icon: '📱' },
                { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    method === m.id ? 'border-primary-500 bg-primary-500/10' : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="font-medium">{m.label}</span>
                </button>
              ))}
            </div>

            {method === 'card' && (
              <div className="space-y-3 mb-5">
                <input className="input-field" placeholder="Card Number (e.g. 4242 4242 4242 4242)" value={cardNum} onChange={e => setCardNum(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field" placeholder="MM/YY" />
                  <input className="input-field" placeholder="CVV" />
                </div>
              </div>
            )}

            {method === 'upi' && (
              <input className="input-field mb-5" placeholder="UPI ID (e.g. name@upi)" value={upiId} onChange={e => setUpiId(e.target.value)} />
            )}

            {method === 'netbanking' && (
              <select className="input-field mb-5">
                <option>HDFC Bank</option>
                <option>SBI</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>Kotak Mahindra</option>
              </select>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(3)} className="btn-primary flex-1">Review →</button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Confirm Payment</h2>

            <div className="bg-dark-700 rounded-2xl p-5 mb-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Creator</span>
                <span className="font-semibold">{application.creator?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Amount</span>
                <span className="font-semibold text-white">₹{parseInt(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Platform Fee</span>
                <span className="text-red-400">-₹{Math.round(amount * 0.10).toLocaleString()}</span>
              </div>
              <div className="border-t border-dark-600 pt-3 flex justify-between">
                <span className="text-gray-400">Creator Gets</span>
                <span className="text-green-400 font-bold text-lg">₹{Math.round(amount * 0.90).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Method</span>
                <span className="capitalize">{method} {method === 'card' && cardNum ? `•••• ${cardNum.slice(-4)}` : ''}</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-5">
              <p className="text-yellow-300 text-xs">⚠️ This amount will be <strong>HELD</strong> on CollabBridge. It will only reach the creator after you approve their content.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button onClick={handlePay} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : '🔒 Pay & Hold'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful! 🎉</h2>
            <p className="text-gray-400 mb-2">₹{parseInt(amount).toLocaleString()} is now securely held in escrow.</p>
            <p className="text-sm text-gray-500 mb-6">Creator will be notified. Once they submit content and you approve it, release the payment.</p>
            <button onClick={onClose} className="btn-primary w-full">Done ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrandPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [totals, setTotals] = useState({ held: 0, released: 0 });

  const fetchData = async () => {
    try {
      const [payRes, appRes] = await Promise.all([
        api.get('/payments/brand/all'),
        api.get('/campaigns/my').then(async r => {
          const all = [];
          for (const c of r.data.campaigns?.slice(0, 10) || []) {
            try {
              const a = await api.get(`/applications/campaign/${c._id}`);
              all.push(...(a.data.applications?.filter(ap => ap.status === 'accepted') || []));
            } catch {}
          }
          return all;
        })
      ]);
      setPayments(payRes.data.payments || []);
      setTotals({ held: payRes.data.totalHeld || 0, released: payRes.data.totalReleased || 0 });
      setApplications(appRes);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Find accepted apps without payment
  const unpaidApps = applications.filter(app =>
    !payments.find(p => p.application?._id === app._id || p.application === app._id)
  );

  const handleRelease = async (paymentId, creatorName, amount) => {
    if (!confirm(`Release ₹${amount.toLocaleString()} to ${creatorName}?`)) return;
    try {
      await api.post(`/payments/release/${paymentId}`);
      toast.success(`✅ ₹${amount.toLocaleString()} released to ${creatorName}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Release failed');
    }
  };

  const handleRefund = async (paymentId) => {
    const reason = prompt('Reason for refund?');
    if (!reason) return;
    try {
      await api.post(`/payments/refund/${paymentId}`, { reason });
      toast.success('Refund processed!');
      fetchData();
    } catch (err) {
      toast.error('Refund failed');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Payment Management</h1>
        <p className="text-gray-400">Escrow payments — secure, transparent, automatic</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-gray-500 mb-1 font-mono">IN ESCROW</div>
          <div className="text-2xl font-bold text-yellow-400">₹{totals.held.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Lock size={11} /> Held on platform</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-gray-500 mb-1 font-mono">RELEASED</div>
          <div className="text-2xl font-bold text-green-400">₹{totals.released.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Paid to creators</div>
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="text-xs text-gray-500 mb-1 font-mono">TOTAL TRANSACTIONS</div>
          <div className="text-2xl font-bold text-primary-400">{payments.length}</div>
          <div className="text-xs text-gray-400 mt-1">All time</div>
        </div>
      </div>

      {/* Pending Payments — accepted apps without payment */}
      {unpaidApps.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-yellow-500/30">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-yellow-400" />
            Pending Payments ({unpaidApps.length})
          </h3>
          <p className="text-gray-400 text-sm mb-4">These creators are hired. Make payment to hold in escrow.</p>
          <div className="space-y-3">
            {unpaidApps.map(app => (
              <div key={app._id} className="bg-dark-700 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.creator?.name || 'C')}&background=4F63FF&color=fff&size=40`}
                    className="w-10 h-10 rounded-xl flex-shrink-0"
                  />
                  <div>
                    <div className="font-semibold">{app.creator?.name}</div>
                    <div className="text-xs text-gray-400">Proposed: ₹{app.proposedRate?.toLocaleString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedApp(app); setShowPayModal(true); }}
                  className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <CreditCard size={14} /> Pay Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-dark-600">
          <h3 className="font-bold text-lg">Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <CreditCard size={40} className="mx-auto mb-4 opacity-20" />
            <p>No payments yet. Hire a creator to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-600">
            {payments.map(p => {
              const cfg = statusConfig[p.status] || statusConfig.pending;
              return (
                <div key={p._id} className="p-5 flex items-center gap-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.creator?.name || 'C')}&background=22223A&color=4F63FF&size=44`}
                    className="w-11 h-11 rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{p.creator?.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{p.transactionId}</div>
                    <div className="text-xs text-gray-400">{p.campaign?.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">₹{p.amount?.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">Creator: ₹{p.creatorAmount?.toLocaleString()}</div>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-xl font-mono whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {p.status === 'held' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleRelease(p._id, p.creator?.name, p.creatorAmount)}
                        className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-2 rounded-xl transition-all flex items-center gap-1"
                      >
                        <CheckCircle size={13} /> Release
                      </button>
                      <button
                        onClick={() => handleRefund(p._id)}
                        className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-2 rounded-xl transition-all flex items-center gap-1"
                      >
                        <RefreshCw size={13} /> Refund
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPayModal && selectedApp && (
        <PaymentModal
          application={selectedApp}
          onClose={() => { setShowPayModal(false); setSelectedApp(null); }}
          onSuccess={() => { fetchData(); }}
        />
      )}
    </div>
  );
}
