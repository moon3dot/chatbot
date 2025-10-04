const Admin = require('../models/Admin');
const Site = require('../models/Site');
const generateToken = require('../utils/generateToken');

// @desc    دریافت تمام ادمین‌های یک سایت
// @route   GET /api/sites/:siteId/admins
// @access  Private
exports.getAllAdmins = async (req, res, next) => {
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

    // دریافت ادمین‌ها
    const admins = await Admin.find({ siteId })
      .populate('teamId', 'name department')
      .sort('-createdAt')
      .select('-password');

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    next(error);
  }
};

// @desc    دریافت یک ادمین
// @route   GET /api/sites/:siteId/admins/:adminId
// @access  Private
exports.getAdmin = async (req, res, next) => {
  try {
    const { siteId, adminId } = req.params;

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

    // دریافت ادمین
    const admin = await Admin.findById(adminId)
      .populate('teamId', 'name department')
      .select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'ادمین یافت نشد'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ایجاد ادمین جدید
// @route   POST /api/sites/:siteId/admins
// @access  Private
exports.createAdmin = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { username, password, fullName, email, role, teamId } = req.body;

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

    // اعتبارسنجی
    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'نام کاربری، رمز عبور و نام کامل الزامی است'
      });
    }

    // بررسی تکراری بودن username
    const existingAdmin = await Admin.findOne({ siteId, username });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'این نام کاربری قبلاً ثبت شده است'
      });
    }

    // تنظیم permissions بر اساس role
    let permissions = {
      canTransferChat: true,
      canViewAllChats: false,
      canManageAdmins: false,
      canAccessReports: false,
      canSendVoice: true,
      canSendFiles: true
    };

    if (role === 'super_admin') {
      permissions = {
        canTransferChat: true,
        canViewAllChats: true,
        canManageAdmins: true,
        canAccessReports: true,
        canSendVoice: true,
        canSendFiles: true
      };
    } else if (role === 'admin') {
      permissions.canViewAllChats = true;
      permissions.canAccessReports = true;
    }

    // ایجاد ادمین
    const admin = await Admin.create({
      siteId,
      username,
      password,
      fullName,
      email,
      role: role || 'admin',
      teamId,
      permissions
    });

    // حذف password از response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: 'ادمین با موفقیت ایجاد شد',
      data: adminData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    بروزرسانی ادمین
// @route   PUT /api/sites/:siteId/admins/:adminId
// @access  Private
exports.updateAdmin = async (req, res, next) => {
  try {
    const { siteId, adminId } = req.params;

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
    let admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'ادمین یافت نشد'
      });
    }

    // اگر role تغییر کرد، permissions رو بروزرسانی کن
    if (req.body.role && req.body.role !== admin.role) {
      if (req.body.role === 'super_admin') {
        req.body.permissions = {
          canTransferChat: true,
          canViewAllChats: true,
          canManageAdmins: true,
          canAccessReports: true,
          canSendVoice: true,
          canSendFiles: true
        };
      } else if (req.body.role === 'admin') {
        req.body.permissions = {
          canTransferChat: true,
          canViewAllChats: true,
          canManageAdmins: false,
          canAccessReports: true,
          canSendVoice: true,
          canSendFiles: true
        };
      } else {
        req.body.permissions = {
          canTransferChat: true,
          canViewAllChats: false,
          canManageAdmins: false,
          canAccessReports: false,
          canSendVoice: true,
          canSendFiles: true
        };
      }
    }

    // بروزرسانی (username نمیتونه تغییر کنه)
    const { username, ...updateData } = req.body;

    admin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'ادمین با موفقیت بروزرسانی شد',
      data: admin
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف ادمین
// @route   DELETE /api/sites/:siteId/admins/:adminId
// @access  Private
exports.deleteAdmin = async (req, res, next) => {
  try {
    const { siteId, adminId } = req.params;

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

    // پیدا کردن و حذف ادمین
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'ادمین یافت نشد'
      });
    }

    await admin.deleteOne();

    res.status(200).json({
      success: true,
      message: 'ادمین با موفقیت حذف شد'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ورود ادمین
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res, next) => {
  try {
    const { siteId, username, password } = req.body;

    // اعتبارسنجی
    if (!siteId || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً تمام فیلدها را پر کنید'
      });
    }

    // بررسی وجود ادمین
    const admin = await Admin.findOne({ siteId, username }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // بررسی فعال بودن
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'حساب کاربری شما غیرفعال شده است'
      });
    }

    // بررسی رمز عبور
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است'
      });
    }

    // بروزرسانی وضعیت و آخرین فعالیت
    admin.status = 'online';
    admin.lastActivity = Date.now();
    await admin.save();

    // تولید توکن
    const token = generateToken(admin._id);

    // حذف password از response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      data: {
        token,
        admin: adminData
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    بروزرسانی وضعیت ادمین
// @route   PUT /api/admin/status
// @access  Private (Admin)
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['online', 'offline', 'busy', 'away'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'وضعیت نامعتبر است'
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin._id,
      { status, lastActivity: Date.now() },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    next(error);
  }
};