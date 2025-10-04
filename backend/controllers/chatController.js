const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Customer = require('../models/Customer');
const Site = require('../models/Site');

// @desc    دریافت تمام چت‌های یک سایت
// @route   GET /api/sites/:siteId/chats
// @access  Private
exports.getAllChats = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { status, adminId, search } = req.query;

    // بررسی مالکیت سایت
    const site = await Site.findById(siteId);
    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'سایت یافت نشد'
      });
    }

    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'شما مالک این سایت نیستید'
      });
    }

    // ساخت query
    let query = { siteId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (adminId) {
      query.adminId = adminId;
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    // دریافت چت‌ها
    const chats = await Chat.find(query)
      .populate('adminId', 'fullName username')
      .populate('customerId', 'name email')
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    دریافت یک چت
// @route   GET /api/chats/:chatId
// @access  Private
exports.getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('adminId', 'fullName username email')
      .populate('customerId', 'name email phone');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'چت یافت نشد'
      });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ایجاد چت جدید
// @route   POST /api/sites/:siteId/chats
// @access  Public
exports.createChat = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { customerName, customerEmail, customerPhone, subject, metadata } = req.body;

    // بررسی وجود سایت
    const site = await Site.findById(siteId);
    if (!site || site.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'سایت یافت نشد یا غیرفعال است'
      });
    }

    // پیدا کردن یا ایجاد customer
    let customer = null;
    if (customerEmail) {
      customer = await Customer.findOne({ siteId, email: customerEmail });
      if (!customer) {
        customer = await Customer.create({
          siteId,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          metadata
        });
      }
    }

    // ایجاد چت
    const chat = await Chat.create({
      siteId,
      customerId: customer ? customer._id : null,
      customerName: customerName || 'کاربر ناشناس',
      customerEmail,
      customerPhone,
      subject,
      metadata,
      isAnonymous: !customer
    });

    // بروزرسانی تعداد چت‌های customer
    if (customer) {
      customer.totalChats += 1;
      customer.lastChatAt = Date.now();
      await customer.save();
    }

    res.status(201).json({
      success: true,
      message: 'چت با موفقیت ایجاد شد',
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    دریافت پیام‌های یک چت
// @route   GET /api/chats/:chatId/messages
// @access  Private/Public
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    let query = { chatId, isDeleted: false };

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort('-timestamp')
      .limit(parseInt(limit))
      .populate('replyTo', 'content senderName');

    // معکوس کردن ترتیب برای نمایش صحیح
    messages.reverse();

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ارسال پیام
// @route   POST /api/chats/:chatId/messages
// @access  Private/Public
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, type, senderType, senderId, senderName, replyTo } = req.body;

    // بررسی وجود چت
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'چت یافت نشد'
      });
    }

    // اعتبارسنجی
    if (!content || !senderType || !senderId) {
      return res.status(400).json({
        success: false,
        message: 'محتوا، نوع فرستنده و شناسه فرستنده الزامی است'
      });
    }

    // ایجاد پیام
    const message = await Message.create({
      chatId,
      senderId,
      senderType,
      senderName,
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

    // افزایش تعداد پیام‌های خوانده نشده
    if (senderType === 'customer') {
      chat.unreadCount += 1;
    }

    await chat.save();

    // populate کردن پیام
    const populatedMessage = await Message.findById(message._id)
      .populate('replyTo', 'content senderName');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    انتقال چت
// @route   POST /api/chats/:chatId/transfer
// @access  Private (Admin)
exports.transferChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { toAdminId, reason } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'چت یافت نشد'
      });
    }

    // اضافه کردن به تاریخچه انتقال
    chat.transferHistory.push({
      fromAdmin: chat.adminId,
      toAdmin: toAdminId,
      reason
    });

    chat.adminId = toAdminId;
    chat.status = 'transferred';
    await chat.save();

    // ایجاد پیام سیستمی
    await Message.create({
      chatId,
      senderId: req.admin._id,
      senderType: 'admin',
      content: `چت به ادمین دیگری منتقل شد. دلیل: ${reason || 'ندارد'}`,
      type: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'چت با موفقیت منتقل شد',
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    بستن چت
// @route   POST /api/chats/:chatId/close
// @access  Private (Admin)
exports.closeChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'چت یافت نشد'
      });
    }

    chat.status = 'closed';
    chat.endTime = Date.now();
    await chat.save();

    // ایجاد پیام سیستمی
    await Message.create({
      chatId,
      senderId: req.admin._id,
      senderType: 'admin',
      content: 'چت بسته شد',
      type: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'چت با موفقیت بسته شد',
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    امتیازدهی به چت
// @route   POST /api/chats/:chatId/rate
// @access  Public
exports.rateChat = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { score, comment } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'امتیاز باید بین 1 تا 5 باشد'
      });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'چت یافت نشد'
      });
    }

    chat.rating = {
      score,
      comment,
      ratedAt: Date.now()
    };

    await chat.save();

    res.status(200).json({
      success: true,
      message: 'امتیاز با موفقیت ثبت شد',
      data: chat
    });
  } catch (error) {
    next(error);
  }
};

// @desc    علامت‌گذاری پیام‌ها به عنوان خوانده شده
// @route   PUT /api/chats/:chatId/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    // بروزرسانی تمام پیام‌های خوانده نشده
    await Message.updateMany(
      { chatId, isRead: false, senderType: 'customer' },
      { isRead: true, readAt: Date.now() }
    );

    // صفر کردن شمارنده پیام‌های خوانده نشده
    await Chat.findByIdAndUpdate(chatId, { unreadCount: 0 });

    res.status(200).json({
      success: true,
      message: 'پیام‌ها به عنوان خوانده شده علامت‌گذاری شدند'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ویرایش پیام
// @route   PUT /api/messages/:messageId
// @access  Private (Admin)
exports.editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'پیام یافت نشد'
      });
    }

    // ذخیره محتوای اصلی
    if (!message.originalContent) {
      message.originalContent = message.content;
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = Date.now();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'پیام با موفقیت ویرایش شد',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف پیام
// @route   DELETE /api/messages/:messageId
// @access  Private (Admin)
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'پیام یافت نشد'
      });
    }

    message.isDeleted = true;
    message.deletedAt = Date.now();
    message.deletedBy = req.admin._id;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'پیام با موفقیت حذف شد'
    });
  } catch (error) {
    next(error);
  }
};