import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import { chatAPI } from '../utils/api';
import { initializeSocket, getSocket, socketEvents } from '../utils/socket';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Send,
  Paperclip,
  Mic,
  Search,
  Filter,
  User,
  Clock,
  CheckCheck,
  MoreVertical,
  X,
  Loader,
} from 'lucide-react';

const AdminPanel = () => {
  const { siteId } = useParams();
  const {
    chats,
    activeChat,
    messages,
    typing,
    setChats,
    setActiveChat,
    setMessages,
    addMessage,
    setTyping,
  } = useChatStore();

  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, waiting, active, closed

  useEffect(() => {
    fetchChats();
    const socket = initializeSocket();

    // Listen to socket events
    socket.on(socketEvents.NEW_CHAT_REQUEST, handleNewChat);
    socket.on(socketEvents.NEW_MESSAGE, handleNewMessage);
    socket.on(socketEvents.USER_TYPING, handleUserTyping);

    return () => {
      socket.off(socketEvents.NEW_CHAT_REQUEST);
      socket.off(socketEvents.NEW_MESSAGE);
      socket.off(socketEvents.USER_TYPING);
    };
  }, [siteId]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getAll(siteId, {
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      setChats(response.data.data || []);
    } catch (error) {
      toast.error('خطا در دریافت چت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = async (chat) => {
    try {
      setActiveChat(chat);
      const response = await chatAPI.getMessages(chat._id);
      setMessages(response.data.data || []);

      // Join chat room
      const socket = getSocket();
      socket.emit(socketEvents.JOIN_CHAT, { chatId: chat._id });
    } catch (error) {
      toast.error('خطا در دریافت پیام‌ها');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    try {
      const socket = getSocket();
      socket.emit(socketEvents.SEND_MESSAGE, {
        chatId: activeChat._id,
        message: messageInput,
        type: 'text',
      });

      setMessageInput('');
    } catch (error) {
      toast.error('خطا در ارسال پیام');
    }
  };

  const handleNewChat = (chat) => {
    setChats([chat, ...chats]);
    toast.success('درخواست چت جدید دریافت شد');
  };

  const handleNewMessage = (message) => {
    addMessage(message);
    // Auto scroll to bottom
    setTimeout(() => {
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  };

  const handleUserTyping = (data) => {
    if (data.chatId === activeChat?._id) {
      setTyping(true);
      setTimeout(() => setTyping(false), 3000);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' || chat.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statuses = {
      waiting: { label: 'در انتظار', class: 'bg-yellow-100 text-yellow-700' },
      active: { label: 'فعال', class: 'bg-green-100 text-green-700' },
      closed: { label: 'بسته شده', class: 'bg-gray-100 text-gray-700' },
    };
    return statuses[status] || statuses.waiting;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3">پنل ادمین</h2>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {['all', 'waiting', 'active', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all'
                  ? 'همه'
                  : status === 'waiting'
                  ? 'در انتظار'
                  : status === 'active'
                  ? 'فعال'
                  : 'بسته'}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare size={48} className="mb-2" />
              <p>چتی یافت نشد</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const statusBadge = getStatusBadge(chat.status);
              return (
                <div
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeChat?._id === chat._id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="text-primary-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {chat.customerName || 'کاربر ناشناس'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {chat.customerEmail}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {chat.lastMessage || 'پیامی وجود ندارد'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(chat.createdAt).toLocaleTimeString('fa-IR')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="text-primary-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {activeChat.customerName || 'کاربر ناشناس'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {activeChat.customerEmail}
                  </p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div
              id="messages-container"
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.senderType === 'admin'
                      ? 'justify-start'
                      : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderType === 'admin'
                        ? 'bg-white text-gray-900'
                        : 'bg-primary-600 text-white'
                    }`}
                  >
                    <p>{message.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString(
                          'fa-IR',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </span>
                      {message.senderType === 'admin' && message.isRead && (
                        <CheckCheck size={14} className="opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-end">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <Paperclip size={20} />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <Mic size={20} />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">یک چت را انتخاب کنید</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;