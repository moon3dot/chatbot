const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  loginAdmin,
  updateStatus
} = require('../controllers/adminController');
const { protectUser, protectAdmin } = require('../middleware/auth');

// ورود ادمین (عمومی)
router.post('/login', loginAdmin);

// بروزرسانی وضعیت ادمین
router.put('/status', protectAdmin, updateStatus);

// مدیریت ادمین‌های هر سایت (نیاز به احراز هویت صاحب سایت)
router.route('/sites/:siteId/admins')
  .get(protectUser, getAllAdmins)
  .post(protectUser, createAdmin);

router.route('/sites/:siteId/admins/:adminId')
  .get(protectUser, getAdmin)
  .put(protectUser, updateAdmin)
  .delete(protectUser, deleteAdmin);

module.exports = router;