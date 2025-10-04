import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket متصل شد:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket قطع شد');
  });

  socket.on('connect_error', (error) => {
    console.error('خطا در اتصال Socket:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn('Socket هنوز مقداردهی نشده است');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Socket Events
export const socketEvents = {
  // Join/Leave
  JOIN_CHAT: 'join-chat',
  LEAVE_CHAT: 'leave-chat',
  
  // Messages
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  MESSAGE_EDITED: 'message-edited',
  MESSAGE_DELETED: 'message-deleted',
  
  // Typing
  START_TYPING: 'start-typing',
  STOP_TYPING: 'stop-typing',
  USER_TYPING: 'user-typing',
  
  // Chat Status
  CHAT_ASSIGNED: 'chat-assigned',
  CHAT_TRANSFERRED: 'chat-transferred',
  CHAT_CLOSED: 'chat-closed',
  
  // Admin Status
  ADMIN_ONLINE: 'admin-online',
  ADMIN_OFFLINE: 'admin-offline',
  ADMIN_STATUS_CHANGED: 'admin-status-changed',
  
  // Read Status
  MARK_AS_READ: 'mark-as-read',
  MESSAGE_READ: 'message-read',
  
  // Notifications
  NEW_CHAT_REQUEST: 'new-chat-request',
  CHAT_NOTIFICATION: 'chat-notification',
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  socketEvents,
};