// Middleware برای بررسی دسترسی‌های ادمین

// بررسی دسترسی انتقال چت
exports.canTransferChat = (req, res, next) => {
  if (!req.admin || !req.admin.permissions || !req.admin.permissions.canTransferChat) {
    return res.status(403).json({
      success: false,
      message: 'شما دسترسی انتقال چت را ندارید'
    });
  }
  next();
};

// بررسی دسترسی مشاهده همه چت‌ها
exports.canViewAllChats = (req, res, next) => {
  if (!req.admin || !req.admin.permissions || !req.admin.permissions.canViewAllChats) {
    return res.status(403).json({
      success: false,
      message: 'شما دسترسی مشاهده همه چت‌ها را ندارید'
    });
  }
  next();
};

// بررسی دسترسی مدیریت ادمین‌ها
exports.canManageAdmins = (req, res, next) => {
  if (!req.admin || !req.admin.permissions || !req.admin.permissions.canManageAdmins) {
    return res.status(403).json({
      success: false,
      message: 'شما دسترسی مدیریت ادمین‌ها را ندارید'
    });
  }
  next();
};

// بررسی دسترسی به گزارش‌ها
exports.canAccessReports = (req, res, next) => {
  if (!req.admin || !req.admin.permissions || !req.admin.permissions.canAccessReports) {
    return res.status(403).json({
      success: false,
      message: 'شما دسترسی به گزارش‌ها را ندارید'
    });
  }
  next();
};

// بررسی دسترسی ارسال فایل صوتی
exports.canSendVoice = (req, res, next) => {
  if (!req.admin || !req.admin.permissions || !req.admin.permissions.canSendVoice) {
    return res.status(403).json({
      success: false,
      message: 'شما دسترسی ارسال پیام صوتی را ندارید'
    });
  }
  next();
};

// بررسی دسترسی ارسال فایل
exports.canSendFiles = (req, res, next) => {
  if (!req.admin || !req.admin.permissions || !req.admin.permissions.canSendFiles) {
    return res.status(403).json({
      success: false,
      message: 'شما دسترسی ارسال فایل را ندارید'
    });
  }
  next();
};

// بررسی نقش سوپر ادمین
exports.isSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'فقط سوپر ادمین‌ها به این بخش دسترسی دارند'
    });
  }
  next();
};

// بررسی نقش ادمین یا بالاتر
exports.isAdminOrHigher = (req, res, next) => {
  if (!req.admin || !['admin', 'super_admin'].includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      message: 'دسترسی محدود به ادمین‌ها'
    });
  }
  next();
};