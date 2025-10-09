import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, MessageCircle } from 'lucide-react';
import { initializeSocket, getSocket, socketEvents } from '../utils/socket';

const UserWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [chatStarted, setChatStarted] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const messagesEndRef = useRef(null);

  // دریافت token از URL
  const urlParams = new URLSearchParams(window.location.search);
  const siteToken = urlParams.get('token');

  useEffect(() => {
    if (chatStarted && chatId && customerId) {
      const socket = initializeSocket();
      socket.emit(socketEvents.JOIN_CHAT, {
        chatId,
        userType: 'customer',
        userId: customerId,
      });

      socket.on(socketEvents.NEW_MESSAGE, (message) => {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      });

      return () => {
        socket.off(socketEvents.NEW_MESSAGE);
      };
    }
  }, [chatStarted, chatId, customerId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startChat = async () => {
    if (!customerInfo.name) {
      alert('لطفاً نام خود را وارد کنید');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/sites/${siteToken}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          subject: 'چت جدید'
        })
      });

      const data = await response.json();
      if (data.success) {
        setChatId(data.data._id);
        setCustomerId(data.data.customerId);
        setChatStarted(true);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!customerId) {
      console.error('شناسه مشتری یافت نشد');
      return;
    }

    const socket = getSocket();
    socket.emit(socketEvents.SEND_MESSAGE, {
      chatId,
      senderId: customerId,
      senderType: 'customer',
      senderName: customerInfo.name || 'کاربر',
      content: inputMessage,
      type: 'text'
    });

    setInputMessage('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={24} />
          <span className="font-semibold">پشتیبانی آنلاین</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
            <Minimize2 size={20} />
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!chatStarted ? (
        <div className="flex-1 p-6 flex flex-col justify-center gap-4">
          <h3 className="text-xl font-bold text-gray-800 text-center">شروع گفتگو</h3>
          <input
            type="text"
            placeholder="نام شما *"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="email"
            placeholder="ایمیل (اختیاری)"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="شماره تماس (اختیاری)"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={startChat}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            شروع گفتگو
          </button>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p>گفتگو را شروع کنید</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-3 ${
                    msg.senderType === 'customer' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-lg max-w-xs ${
                      msg.senderType === 'customer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="پیام خود را بنویسید..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserWidget;
