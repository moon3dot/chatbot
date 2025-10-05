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

module.exports = router;