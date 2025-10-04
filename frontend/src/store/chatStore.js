import { create } from 'zustand';

export const useChatStore = create((set) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineAdmins: [],
  typing: false,

  // تنظیم لیست چت‌ها
  setChats: (chats) => set({ chats }),

  // افزودن چت جدید
  addChat: (chat) =>
    set((state) => ({
      chats: [chat, ...state.chats],
    })),

  // بروزرسانی چت
  updateChat: (chatId, updatedData) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === chatId ? { ...chat, ...updatedData } : chat
      ),
    })),

  // تنظیم چت فعال
  setActiveChat: (chat) => set({ activeChat: chat }),

  // تنظیم پیام‌ها
  setMessages: (messages) => set({ messages }),

  // افزودن پیام جدید
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  // بروزرسانی پیام
  updateMessage: (messageId, updatedData) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId ? { ...msg, ...updatedData } : msg
      ),
    })),

  // حذف پیام
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg._id !== messageId),
    })),

  // تنظیم ادمین‌های آنلاین
  setOnlineAdmins: (admins) => set({ onlineAdmins: admins }),

  // تنظیم وضعیت تایپ
  setTyping: (typing) => set({ typing }),

  // پاک کردن چت فعال
  clearActiveChat: () =>
    set({
      activeChat: null,
      messages: [],
      typing: false,
    }),
}));