const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Site = require('../models/Site');

// @desc    دریافت گزارش کلی
// @route   GET /api/sites/:siteId/reports/overview
// @access  Private
exports.getOverview = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { from, to } = req.query;

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

    // تنظیم محدوده زمانی
    const dateFilter = {};
    if (from && to) {
      dateFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    // آمارهای کلی
    const [
      totalChats,
      activeChats,
      closedChats,
      waitingChats,
      totalAdmins,
      onlineAdmins,
      totalCustomers,
      totalMessages
    ] = await Promise.all([
      Chat.countDocuments({ siteId, ...dateFilter }),
      Chat.countDocuments({ siteId, status: 'active', ...dateFilter }),
      Chat.countDocuments({ siteId, status: 'closed', ...dateFilter }),
      Chat.countDocuments({ siteId, status: 'waiting', ...dateFilter }),
      Admin.countDocuments({ siteId, isActive: true }),
      Admin.countDocuments({ siteId, status: 'online' }),
      Customer.countDocuments({ siteId }),
      Message.countDocuments({ 
        chatId: { $in: await Chat.find({ siteId }).distinct('_id') },
        ...dateFilter 
      })
    ]);

    // محاسبه میانگین زمان پاسخ
    const chatsWithResponseTime = await Chat.aggregate([
      { $match: { siteId: site._id, status: 'closed', ...dateFilter } },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages'
        }
      },
      {
        $project: {
          firstCustomerMessage: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$messages',
                  as: 'msg',
                  cond: { $eq: ['$$msg.senderType', 'customer'] }
                }
              },
              0
            ]
          },
          firstAdminMessage: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$messages',
                  as: 'msg',
                  cond: { $eq: ['$$msg.senderType', 'admin'] }
                }
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: [
              '$firstAdminMessage.timestamp',
              '$firstCustomerMessage.timestamp'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const averageResponseTime = chatsWithResponseTime.length > 0
      ? Math.round(chatsWithResponseTime[0].avgResponseTime / 1000) // به ثانیه تبدیل
      : 0;

    // محاسبه نرخ رضایت
    const ratedChats = await Chat.find({
      siteId,
      'rating.score': { $exists: true },
      ...dateFilter
    });

    const satisfactionRate = ratedChats.length > 0
      ? Math.round(
          (ratedChats.reduce((sum, chat) => sum + chat.rating.score, 0) /
            ratedChats.length /
            5) *
            100
        )
      : 0;

    // آمار روزانه (7 روز اخیر)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await Chat.aggregate([
      {
        $match: {
          siteId: site._id,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalChats,
        activeChats,
        closedChats,
        waitingChats,
        totalAdmins,
        onlineAdmins,
        totalCustomers,
        totalMessages,
        averageResponseTime,
        satisfactionRate,
        dailyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    دریافت گزارش عملکرد یک ادمین
// @route   GET /api/sites/:siteId/reports/admin/:adminId
// @access  Private
exports.getAdminPerformance = async (req, res, next) => {
  try {
    const { siteId, adminId } = req.params;
    const { from, to } = req.query;

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

    // پیدا کردن ادمین
    const admin = await Admin.findById(adminId).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'ادمین یافت نشد'
      });
    }

    // تنظیم محدوده زمانی
    const dateFilter = {};
    if (from && to) {
      dateFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    // آمار چت‌های ادمین
    const [totalChats, closedChats, transferredChats] = await Promise.all([
      Chat.countDocuments({ adminId, ...dateFilter }),
      Chat.countDocuments({ adminId, status: 'closed', ...dateFilter }),
      Chat.countDocuments({
        'transferHistory.fromAdmin': adminId,
        ...dateFilter
      })
    ]);

    // محاسبه میانگین زمان پاسخ این ادمین
    const adminChats = await Chat.find({ adminId, ...dateFilter }).select('_id');
    const adminChatIds = adminChats.map((chat) => chat._id);

    const adminResponseTimes = await Chat.aggregate([
      { $match: { _id: { $in: adminChatIds }, status: 'closed' } },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages'
        }
      },
      {
        $project: {
          firstCustomerMessage: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$messages',
                  as: 'msg',
                  cond: { $eq: ['$$msg.senderType', 'customer'] }
                }
              },
              0
            ]
          },
          firstAdminMessage: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$messages',
                  as: 'msg',
                  cond: { $eq: ['$$msg.senderType', 'admin'] }
                }
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: [
              '$firstAdminMessage.timestamp',
              '$firstCustomerMessage.timestamp'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const averageResponseTime = adminResponseTimes.length > 0
      ? Math.round(adminResponseTimes[0].avgResponseTime / 1000)
      : 0;

    // محاسبه نرخ رضایت
    const ratedChats = await Chat.find({
      adminId,
      'rating.score': { $exists: true },
      ...dateFilter
    });

    const satisfactionRate = ratedChats.length > 0
      ? Math.round(
          (ratedChats.reduce((sum, chat) => sum + chat.rating.score, 0) /
            ratedChats.length /
            5) *
            100
        )
      : 0;

    // تعداد پیام‌های ارسال شده
    const messagesSent = await Message.countDocuments({
      chatId: { $in: adminChatIds },
      senderId: adminId,
      senderType: 'admin'
    });

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          username: admin.username,
          role: admin.role
        },
        totalChats,
        closedChats,
        transferredChats,
        messagesSent,
        averageResponseTime,
        satisfactionRate,
        ratings: ratedChats.map((chat) => ({
          score: chat.rating.score,
          comment: chat.rating.comment,
          date: chat.rating.ratedAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    خروجی اکسل ایمیل‌ها
// @route   GET /api/sites/:siteId/reports/export/emails
// @access  Private
exports.exportEmails = async (req, res, next) => {
  try {
    const { siteId } = req.params;

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

    // دریافت تمام ایمیل‌های یونیک
    const customers = await Customer.find(
      { siteId, email: { $exists: true, $ne: '' } },
      'name email phone createdAt'
    ).sort('createdAt');

    // تبدیل به CSV
    let csv = 'نام,ایمیل,شماره تماس,تاریخ ثبت\n';
    customers.forEach((customer) => {
      csv += `${customer.name || 'ندارد'},${customer.email},${
        customer.phone || 'ندارد'
      },${new Date(customer.createdAt).toLocaleDateString('fa-IR')}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=emails_${Date.now()}.csv`
    );
    res.status(200).send('\uFEFF' + csv); // BOM برای UTF-8
  } catch (error) {
    next(error);
  }
};

// @desc    خروجی اکسل شماره تماس‌ها
// @route   GET /api/sites/:siteId/reports/export/phones
// @access  Private
exports.exportPhones = async (req, res, next) => {
  try {
    const { siteId } = req.params;

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

    // دریافت تمام شماره‌های یونیک
    const customers = await Customer.find(
      { siteId, phone: { $exists: true, $ne: '' } },
      'name email phone createdAt'
    ).sort('createdAt');

    // تبدیل به CSV
    let csv = 'نام,شماره تماس,ایمیل,تاریخ ثبت\n';
    customers.forEach((customer) => {
      csv += `${customer.name || 'ندارد'},${customer.phone},${
        customer.email || 'ندارد'
      },${new Date(customer.createdAt).toLocaleDateString('fa-IR')}\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=phones_${Date.now()}.csv`
    );
    res.status(200).send('\uFEFF' + csv); // BOM برای UTF-8
  } catch (error) {
    next(error);
  }
};

// @desc    گزارش چت‌ها بر اساس تاریخ
// @route   GET /api/sites/:siteId/reports/chats-by-date
// @access  Private
exports.getChatsByDate = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { from, to } = req.query;

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

    const dateFilter = {
      siteId: site._id
    };

    if (from && to) {
      dateFilter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to)
      };
    }

    const chatsByDate = await Chat.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          },
          waiting: {
            $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: chatsByDate
    });
  } catch (error) {
    next(error);
  }
};