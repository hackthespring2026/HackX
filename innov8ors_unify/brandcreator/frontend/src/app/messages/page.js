'use client';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/api';
import { io } from 'socket.io-client';
import { Send, MessageSquare } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

let socket;

export default function MessagesPage() {
  const { user } = useSelector(state => state.auth);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();

    // Initialize socket
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000');
    socket.emit('join', user?._id || user?.id);

    socket.on('receiveMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      // Get user's applications to create conversations
      const { data } = await api.get('/applications/my');
      const apps = data.applications;

      // Also get brand-side applications if brand
      let brandApps = [];
      if (user?.role === 'brand') {
        const { data: campaigns } = await api.get('/campaigns/my');
        for (const c of campaigns.campaigns?.slice(0, 5) || []) {
          try {
            const { data: appData } = await api.get(`/applications/campaign/${c._id}`);
            brandApps.push(...(appData.applications || []));
          } catch {}
        }
      }

      const allApps = [...apps, ...brandApps].filter((a, i, arr) =>
        arr.findIndex(x => x._id === a._id) === i
      );

      setConversations(allApps);
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = async (app) => {
    setSelectedConv(app);
    try {
      const { data } = await api.get(`/messages/${app._id}`);
      setMessages(data.messages);
    } catch (err) {
      toast.error('Failed to load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    setSending(true);

    const receiverId = user?._id === selectedConv.creator?._id
      ? selectedConv.brand?._id
      : selectedConv.creator?._id;

    try {
      const { data } = await api.post('/messages', {
        receiverId,
        message: newMessage,
        conversationId: selectedConv._id
      });
      setMessages(prev => [...prev, { ...data.message, sender: { _id: user._id, name: user.name, avatar: user.avatar } }]);
      setNewMessage('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getUserId = () => user?._id || user?.id;
  const isMine = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    return senderId?.toString() === getUserId()?.toString();
  };

  const getOtherParty = (app) => {
    if (getUserId() === (app.creator?._id || app.creator)) {
      return app.brand;
    }
    return app.creator;
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="flex h-screen">
          {/* Conversation List */}
          <div className="w-80 glass border-r border-dark-600 overflow-y-auto">
            <div className="p-6 border-b border-dark-600">
              <h2 className="font-bold text-xl">Messages</h2>
              <p className="text-gray-400 text-sm">{conversations.length} conversations</p>
            </div>

            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-500 mt-1">Apply to campaigns to start chatting</p>
              </div>
            ) : conversations.map(app => {
              const other = getOtherParty(app);
              return (
                <div
                  key={app._id}
                  onClick={() => selectConversation(app)}
                  className={`p-4 border-b border-dark-600 cursor-pointer transition-all ${
                    selectedConv?._id === app._id ? 'bg-primary-500/10 border-l-2 border-l-primary-500' : 'hover:bg-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=22223A&color=4F63FF&size=40`}
                      className="w-10 h-10 rounded-xl flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{other?.name}</div>
                      <div className="text-xs text-gray-500 truncate">{app.campaign?.title || 'Campaign'}</div>
                      <span className={`text-xs mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        app.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                        app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{app.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="glass border-b border-dark-600 p-4 flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getOtherParty(selectedConv)?.name || 'U')}&background=4F63FF&color=fff&size=40`}
                    className="w-10 h-10 rounded-xl"
                  />
                  <div>
                    <div className="font-semibold">{getOtherParty(selectedConv)?.name}</div>
                    <div className="text-xs text-gray-400">{selectedConv.campaign?.title}</div>
                  </div>
                  <div className="ml-auto">
                    <span className={`text-xs px-3 py-1 rounded-full font-mono ${
                      selectedConv.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      Deal: {selectedConv.status}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                      <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No messages yet. Say hello! 👋</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        isMine(msg)
                          ? 'bg-primary-500 text-white rounded-br-sm'
                          : 'glass text-white rounded-bl-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMine(msg) ? 'text-primary-200' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="glass border-t border-dark-600 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      className="input-field flex-1"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="btn-primary px-4 py-3 flex-shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm text-gray-500">Your deals and chats appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
