import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Chat() {
  const [messages, setMessages] = useState([
    { role: 'model', content: 'Salam! Mən "Yoldaş"am. 🚗\nSizə yol hərəkəti qaydaları və cərimələr barədə kömək etməyə hazıram.\nSualınızı yazın və mən sizə cavab verəcəyəm.' }
  ]);
  const [input, setInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef(null);
  const { getAuthHeaders, logout, user, balance, fetchBalance, updateBalance } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage
    }]);
    setIsChatting(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: userMessage,
          history: messages.filter(m => m.role !== 'system')
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        if (response.status === 403) {
          const errorData = await response.json();
          setMessages(prev => [...prev, { 
            role: 'model', 
            content: `⚠️ ${errorData.error || 'Balansınız bitib. Xidmət üçün müştəri xidməti ilə əlaqə saxlayın.'}` 
          }]);
          await fetchBalance();
          return;
        }
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
      }
      
      const data = await response.json();

      if (data.response) {
        setMessages(prev => [...prev, { role: 'model', content: data.response }]);
        if (data.balance !== undefined) {
          updateBalance(data.balance);
        }
      } else if (data.error) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        setMessages(prev => [...prev, { role: 'model', content: `⚠️ Xəta: ${errorMsg}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', content: '⚠️ Xəta: Cavab alına bilmədi.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: `🌐 Bağlantı xətası: ${error.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Yoldaş</h1>
            <p className="text-xs text-blue-200">Sizin rəqəmsal köməkçiniz</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-blue-200">
                {user.name} {user.lastname}
              </span>
              <span className="text-sm font-semibold text-white bg-white/20 px-3 py-1 rounded-full">
                Balans: {balance}
              </span>
            </>
          )}
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
            title="Çıxış"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm flex gap-3 ${msg.role === 'user'
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none'
              : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
              }`}>
              <div className={`mt-1 shrink-0 p-1.5 rounded-full h-fit ${msg.role === 'user' ? 'bg-white/20' : 'bg-blue-50'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} className="text-blue-600" />}
              </div>
              <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {isChatting && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex gap-2 items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white p-3 md:p-4 border-t border-slate-200 shadow-sm">
        {balance <= 0 ? (
          <div className="max-w-4xl mx-auto text-center py-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
              <p className="font-medium">Balansınız bitib. Xidmət üçün müştəri xidməti ilə əlaqə saxlayın.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Sualınızı yazın..."
              className="flex-1 bg-slate-100 border-0 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isChatting}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Send size={20} />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
}

export default Chat;

