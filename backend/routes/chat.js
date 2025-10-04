const express = require('express');
const router = express.Router();
const {
  getAllChats,
  getChat,
  createChat,
  getMessages,
  sendMessage,
  transferChat,
  closeChat,
  rateChat,
  markAsRead,
  editMessage,
  deleteMessage
} = require('../controllers/chatController');
const { protectUser, protectAdmin } = require('../middleware/auth');

// دریافت چت‌های یک سایت (نیاز به احراز هویت صاحب سایت)
router.get('/sites/:siteId/chats', protectUser, getAllChats);

// ایجاد چت جدید (عمومی - برای کاربران سایت)
router.post('/sites/:siteId/chats', createChat);

// عملیات روی چت خاص
router.get('/chats/:chatId', getChat);
router.post('/chats/:chatId/transfer', protectAdmin, transferChat);
router.post('/chats/:chatId/close', protectAdmin, closeChat);
router.post('/chats/:chatId/rate', rateChat);
router.put('/chats/:chatId/read', markAsRead);

// پیام‌ها
router.route('/chats/:chatId/messages')
  .get(getMessages)
  .post(sendMessage);

// ویرایش و حذف پیام
router.put('/messages/:messageId', protectAdmin, editMessage);
router.delete('/messages/:messageId', protectAdmin, deleteMessage);

module.exports = router;