const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Admin = require('../models/Admin');

// Map برای نگهداری socket‌های متصل
const connectedUsers = new Map();
const connectedAdmins = new Map();

const chatHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 کاربر جدید متصل شد:', socket.id);

    // احراز هویت
    socket.on('authenticate', async (data) => {
      try {
        const { token, userType } = data;

        if (!token) {
          socket.emit('error', { message: 'توکن ارسال نشده' });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (userType === 'admin') {
          const admin = await Admin.findById(decoded.id);
          if (admin) {
            socket.userId = admin._id;
            socket.userType = 'admin';
            socket.siteId = admin.siteId;
            connectedAdmins.set(admin._id.toString(), socket.id);

            admin.status = 'online';
            admin.lastActivity = Date.now();
            await admin.save();

            socket.broadcast.emit('admin-status-changed', {
              adminId: admin._id,
              status: 'online'
            });

            console.log(`✅ ادمین احراز هویت شد: ${admin.username}`);
          }
        } else {
          socket.userId = decoded.id || socket.id;
          socket.userType = 'customer';
          connectedUsers.set(socket.userId, socket.id);
          console.log(`✅ کاربر احراز هویت شد: ${socket.userId}`);
        }

        socket.emit('authenticated', { success: true });
      } catch (error) {
        console.error('خطا در احراز هویت:', error);
        socket.emit('error', { message: 'خطا در احراز هویت' });
      }
    });

    // پیوستن به چت
    socket.on('join-chat', async (data) => {
      try {
        const { chatId, userType, userId } = data;

        if (!chatId) {
          socket.emit('error', { message: 'شناسه چت ارسال نشده' });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'چت یافت نشد' });
          return;
        }

        if (!socket.userType) {
          socket.userType = userType || 'customer';
        }

        if (!socket.userId) {
          if (socket.userType === 'admin') {
            socket.userId = userId || chat.adminId;
          } else {
            socket.userId = userId || chat.customerId || chat._id;
          }
        }

        socket.join(chatId);
        socket.currentChatId = chatId;

        console.log(`📥 کاربر ${socket.id} به چت ${chatId} پیوست`);

        socket.to(chatId).emit('user-joined', {
          userId: socket.userId,
          userType: socket.userType
        });

        socket.emit('joined-chat', { chatId, success: true });
      } catch (error) {
        console.error('خطا در پیوستن به چت:', error);
        socket.emit('error', { message: 'خطا در پیوستن به چت' });
      }
    });

    // ترک چت
    socket.on('leave-chat', (data) => {
      const { chatId } = data;
      if (chatId) {
        socket.leave(chatId);
        socket.to(chatId).emit('user-left', {
          userId: socket.userId,
          userType: socket.userType
        });
        console.log(`📤 کاربر ${socket.id} از چت ${chatId} خارج شد`);
      }
    });

    // ارسال پیام
    socket.on('send-message', async (data) => {
      try {
        const { chatId, replyTo } = data;
        const content = data.content || data.message;
        const messageType = data.type || 'text';
        let senderType = data.senderType || socket.userType || 'customer';

        if (!chatId || !content) {
          socket.emit('error', { message: 'اطلاعات ناقص است' });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'چت یافت نشد' });
          return;
        }

        if (!socket.userType) {
          socket.userType = senderType;
        } else {
          senderType = socket.userType;
        }

        if (!socket.userId) {
          if (senderType === 'admin') {
            socket.userId = data.senderId || chat.adminId;
          } else {
            socket.userId = data.senderId || chat.customerId || chat._id;
          }
        }

        const senderId = data.senderId || socket.userId;

        const senderName = data.senderName || (senderType === 'admin'
          ? 'ادمین'
          : chat.customerName || 'کاربر');

        if (!senderId) {
          socket.emit('error', { message: 'شناسه فرستنده نامعتبر است' });
          return;
        }

        const message = await Message.create({
          chatId,
          senderId,
          senderType,
          senderName,
          content,
          type: messageType,
          replyTo
        });

        chat.lastMessage = content.substring(0, 100);
        chat.lastMessageTime = Date.now();
        chat.updatedAt = Date.now();

        if (chat.status === 'waiting') {
          chat.status = 'active';
        }

        if (senderType === 'customer') {
          chat.unreadCount += 1;
        }

        await chat.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('replyTo', 'content senderName');

        io.to(chatId).emit('new-message', populatedMessage);

        console.log(`💬 پیام جدید در چت ${chatId}`);
      } catch (error) {
        console.error('خطا در ارسال پیام:', error);
        socket.emit('error', { message: 'خطا در ارسال پیام' });
      }
    });

    // شروع تایپ
    socket.on('start-typing', (data) => {
      const { chatId } = data;
      if (chatId) {
        socket.to(chatId).emit('user-typing', {
          userId: socket.userId,
          userType: socket.userType,
          chatId
        });
      }
    });

    // توقف تایپ
    socket.on('stop-typing', (data) => {
      const { chatId } = data;
      if (chatId) {
        socket.to(chatId).emit('user-stopped-typing', {
          userId: socket.userId,
          userType: socket.userType,
          chatId
        });
      }
    });

    // علامت‌گذاری پیام‌ها به عنوان خوانده شده
    socket.on('mark-as-read', async (data) => {
      try {
        const { chatId, messageIds } = data;

        if (messageIds && messageIds.length > 0) {
          await Message.updateMany(
            { _id: { $in: messageIds } },
            { isRead: true, readAt: Date.now() }
          );
        } else if (chatId) {
          await Message.updateMany(
            { chatId, isRead: false, senderType: 'customer' },
            { isRead: true, readAt: Date.now() }
          );
        }

        socket.to(chatId).emit('messages-read', {
          chatId,
          messageIds,
          readBy: socket.userId
        });
      } catch (error) {
        console.error('خطا در علامت‌گذاری پیام:', error);
      }
    });

    // انتقال چت
    socket.on('transfer-chat', async (data) => {
      try {
        const { chatId, toAdminId, reason } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'چت یافت نشد' });
          return;
        }

        chat.transferHistory.push({
          fromAdmin: chat.adminId,
          toAdmin: toAdminId,
          reason
        });

        chat.adminId = toAdminId;
        chat.status = 'transferred';
        await chat.save();

        const systemMessage = await Message.create({
          chatId,
          senderId: socket.userId,
          senderType: 'admin',
          content: `چت به ادمین دیگری منتقل شد. دلیل: ${reason || 'ندارد'}`,
          type: 'system'
        });

        io.to(chatId).emit('chat-transferred', {
          chat,
          message: systemMessage
        });

        const newAdminSocketId = connectedAdmins.get(toAdminId.toString());
        if (newAdminSocketId) {
          io.to(newAdminSocketId).emit('new-chat-assigned', { chat });
        }

        console.log(`🔄 چت ${chatId} منتقل شد`);
      } catch (error) {
        console.error('خطا در انتقال چت:', error);
        socket.emit('error', { message: 'خطا در انتقال چت' });
      }
    });

    // بستن چت
    socket.on('close-chat', async (data) => {
      try {
        const { chatId } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'چت یافت نشد' });
          return;
        }

        chat.status = 'closed';
        chat.endTime = Date.now();
        await chat.save();

        const systemMessage = await Message.create({
          chatId,
          senderId: socket.userId,
          senderType: 'admin',
          content: 'چت بسته شد',
          type: 'system'
        });

        io.to(chatId).emit('chat-closed', {
          chat,
          message: systemMessage
        });

        console.log(`🔒 چت ${chatId} بسته شد`);
      } catch (error) {
        console.error('خطا در بستن چت:', error);
        socket.emit('error', { message: 'خطا در بستن چت' });
      }
    });

    // قطع اتصال
    socket.on('disconnect', async () => {
      console.log('❌ کاربر قطع شد:', socket.id);

      if (socket.userType === 'admin') {
        connectedAdmins.delete(socket.userId?.toString());

        try {
          const admin = await Admin.findById(socket.userId);
          if (admin) {
            admin.status = 'offline';
            admin.lastActivity = Date.now();
            await admin.save();

            socket.broadcast.emit('admin-status-changed', {
              adminId: admin._id,
              status: 'offline'
            });
          }
        } catch (error) {
          console.error('خطا در بروزرسانی وضعیت ادمین:', error);
        }
      } else {
        connectedUsers.delete(socket.userId);
      }

      if (socket.currentChatId) {
        socket.to(socket.currentChatId).emit('user-left', {
          userId: socket.userId,
          userType: socket.userType
        });
      }
    });
  });
};

module.exports = chatHandler;
