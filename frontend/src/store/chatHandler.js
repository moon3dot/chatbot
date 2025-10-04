const jwt = require('jsonwebtoken');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Admin = require('../models/Admin');

// Map برای نگهداری socket‌های متصل
const connectedUsers = new Map(); // userId -> socketId
const connectedAdmins = new Map(); // adminId -> socketId

const chatHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 کاربر جدید متصل شد:', socket.id);

    // احراز هویت
    socket.on('authenticate', async (data) => {
      try {
        const { token, userType } = data; // userType: 'customer' or 'admin'

        if (!token) {
          socket.emit('error', { message: 'توکن ارسال نشده' });
          return;
        }

        // بررسی توکن
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (userType === 'admin') {
          const admin = await Admin.findById(decoded.id);
          if (admin) {
            socket.userId = admin._id;
            socket.userType = 'admin';
            socket.siteId = admin.siteId;
            connectedAdmins.set(admin._id.toString(), socket.id);

            // بروزرسانی وضعیت ادمین
            admin.status = 'online';
            admin.lastActivity = Date.now();
            await admin.save();

            // اطلاع به سایر ادمین‌ها
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
        const { chatId } = data;

        if (!chatId) {
          socket.emit('error', { message: 'شناسه چت ارسال نشده' });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'چت یافت نشد' });
          return;
        }

        // پیوستن به room
        socket.join(chatId);
        socket.currentChatId = chatId;

        console.log(`📥 کاربر ${socket.id} به چت ${chatId} پیوست`);

        // ارسال اطلاع به سایر اعضا
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
        const { chatId, content, type, replyTo } = data;

        if (!chatId || !content) {
          socket.emit('error', { message: 'اطلاعات ناقص است' });
          return;
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'چت یافت نشد' });
          return;
        }

        // ایجاد پیام
        const message = await Message.create({
          chatId,
          senderId: socket.userId,
          senderType: socket.userType,
          content,
          type: type || 'text',
          replyTo
        });

        // بروزرسانی چت
        chat.lastMessage = content.substring(0, 100);
        chat.lastMessageTime = Date.now();
        chat.updatedAt = Date.now();

        if (chat.status === 'waiting') {
          chat.status = 'active';
        }

        if (socket.userType === 'customer') {
          chat.unreadCount += 1;
        }

        await chat.save();

        // populate کردن پیام
        const populatedMessage = await Message.findById(message._id)
          .populate('replyTo', 'content senderName');

        // ارسال پیام به همه اعضای چت
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

    // علامت‌گذاری به عنوان خوانده شده
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

        // ارسال اطلاع به فرستنده
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

        // افزودن به تاریخچه انتقال
        chat.transferHistory.push({
          fromAdmin: chat.adminId,
          toAdmin: toAdminId,
          reason
        });

        chat.adminId = toAdminId;
        chat.status = 'transferred';
        await chat.save();

        // ایجاد پیام سیستمی
        const systemMessage = await Message.create({
          chatId,
          senderId: socket.userId,
          senderType: 'admin',
          content: `چت به ادمین دیگری منتقل شد. دلیل: ${reason || 'ندارد'}`,
          type: 'system'
        });

        // اطلاع به همه
        io.to(chatId).emit('chat-transferred', {
          chat,
          message: systemMessage
        });

        // اطلاع به ادمین جدید
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

        // ایجاد پیام سیستمی
        const systemMessage = await Message.create({
          chatId,
          senderId: socket.userId,
          senderType: 'admin',
          content: 'چت بسته شد',
          type: 'system'
        });

        // اطلاع به همه
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

      // حذف از map
      if (socket.userType === 'admin') {
        connectedAdmins.delete(socket.userId?.toString());

        // بروزرسانی وضعیت ادمین
        try {
          const admin = await Admin.findById(socket.userId);
          if (admin) {
            admin.status = 'offline';
            admin.lastActivity = Date.now();
            await admin.save();

            // اطلاع به سایر ادمین‌ها
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

      // ترک تمام room‌ها
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