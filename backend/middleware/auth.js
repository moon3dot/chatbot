const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// محافظت از روت‌های کاربر (صاحب سایت)
exports.protectUser = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'دسترسی غیرمجاز - توکن ارسال نشده'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است'
    });
  }
};

// محافظت از روت‌های ادمین
exports.protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'دسترسی غیرمجاز - توکن ارسال نشده'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select('+password');
    
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'ادمین یافت نشد'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است'
    });
  }
};

// بررسی مالکیت سایت
exports.checkSiteOwnership = async (req, res, next) => {
  const Site = require('../models/Site');
  
  try {
    const site = await Site.findById(req.params.siteId);
    
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

    req.site = site;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'خطا در بررسی مالکیت سایت'
    });
  }
};