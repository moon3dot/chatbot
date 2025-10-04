const express = require('express');
const router = express.Router();
const {
  getOverview,
  getAdminPerformance,
  exportEmails,
  exportPhones,
  getChatsByDate
} = require('../controllers/reportController');
const { protectUser } = require('../middleware/auth');

// تمام route‌های گزارش نیاز به احراز هویت دارند
router.use(protectUser);

// گزارش کلی
router.get('/sites/:siteId/reports/overview', getOverview);

// گزارش عملکرد ادمین
router.get('/sites/:siteId/reports/admin/:adminId', getAdminPerformance);

// خروجی اکسل
router.get('/sites/:siteId/reports/export/emails', exportEmails);
router.get('/sites/:siteId/reports/export/phones', exportPhones);

// گزارش چت‌ها بر اساس تاریخ
router.get('/sites/:siteId/reports/chats-by-date', getChatsByDate);

module.exports = router;