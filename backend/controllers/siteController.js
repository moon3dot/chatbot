const Site = require('../models/Site');
const Admin = require('../models/Admin');

// @desc    دریافت تمام سایت‌های کاربر
// @route   GET /api/sites
// @access  Private
exports.getAllSites = async (req, res, next) => {
  try {
    const sites = await Site.find({ userId: req.user._id }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: sites.length,
      data: sites
    });
  } catch (error) {
    next(error);
  }
};

// @desc    دریافت یک سایت
// @route   GET /api/sites/:id
// @access  Private
exports.getSite = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'سایت یافت نشد'
      });
    }

    // بررسی مالکیت
    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'شما مالک این سایت نیستید'
      });
    }

    res.status(200).json({
      success: true,
      data: site
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ایجاد سایت جدید
// @route   POST /api/sites
// @access  Private
exports.createSite = async (req, res, next) => {
  try {
    const { siteName, siteUrl } = req.body;

    // اعتبارسنجی
    if (!siteName || !siteUrl) {
      return res.status(400).json({
        success: false,
        message: 'نام سایت و آدرس سایت الزامی است'
      });
    }

    // ایجاد سایت (توکن به صورت خودکار در pre-save hook ساخته میشه)
    const site = await Site.create({
      userId: req.user._id,
      siteName,
      siteUrl
    });

    res.status(201).json({
      success: true,
      message: 'سایت با موفقیت ایجاد شد',
      data: site
    });
  } catch (error) {
    next(error);
  }
};

// @desc    بروزرسانی سایت
// @route   PUT /api/sites/:id
// @access  Private
exports.updateSite = async (req, res, next) => {
  try {
    let site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'سایت یافت نشد'
      });
    }

    // بررسی مالکیت
    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'شما مالک این سایت نیستید'
      });
    }

    // بروزرسانی
    site = await Site.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'سایت با موفقیت بروزرسانی شد',
      data: site
    });
  } catch (error) {
    next(error);
  }
};

// @desc    حذف سایت
// @route   DELETE /api/sites/:id
// @access  Private
exports.deleteSite = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'سایت یافت نشد'
      });
    }

    // بررسی مالکیت
    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'شما مالک این سایت نیستید'
      });
    }

    // حذف تمام ادمین‌های مرتبط
    await Admin.deleteMany({ siteId: req.params.id });

    // حذف سایت
    await site.deleteOne();

    res.status(200).json({
      success: true,
      message: 'سایت با موفقیت حذف شد'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    دریافت اسکریپت‌های سایت
// @route   GET /api/sites/:id/scripts
// @access  Private
exports.getScripts = async (req, res, next) => {
  try {
    const site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'سایت یافت نشد'
      });
    }

    // بررسی مالکیت
    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'شما مالک این سایت نیستید'
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const userScript = `<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/widget/user?token=${site.token}';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:350px;height:500px;border:none;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:12px;';
  document.body.appendChild(iframe);
})();
</script>`;

    const adminScript = `<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/widget/admin?token=${site.token}';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:12px;';
  document.body.appendChild(iframe);
})();
</script>`;

    res.status(200).json({
      success: true,
      data: {
        userScript,
        adminScript,
        token: site.token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    بروزرسانی تنظیمات سایت
// @route   PUT /api/sites/:id/settings
// @access  Private
exports.updateSettings = async (req, res, next) => {
  try {
    let site = await Site.findById(req.params.id);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'سایت یافت نشد'
      });
    }

    // بررسی مالکیت
    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'شما مالک این سایت نیستید'
      });
    }

    // بروزرسانی تنظیمات
    site.settings = {
      ...site.settings,
      ...req.body
    };

    await site.save();

    res.status(200).json({
      success: true,
      message: 'تنظیمات با موفقیت بروزرسانی شد',
      data: site
    });
  } catch (error) {
    next(error);
  }
};