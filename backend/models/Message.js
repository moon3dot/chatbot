const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['customer', 'admin'],
    required: true
  },
  senderName: {
    type: String
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'voice', 'video', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  fileMimeType: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  originalContent: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  metadata: {
    duration: Number, // برای ویس
    thumbnail: String, // برای ویدیو
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// ایندکس‌ها
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ chatId: 1, isRead: 1 });

// متد علامت‌گذاری به عنوان خوانده شده
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = Date.now();
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);