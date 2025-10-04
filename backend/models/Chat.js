const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerName: {
    type: String,
    default: 'کاربر ناشناس'
  },
  customerEmail: {
    type: String
  },
  customerPhone: {
    type: String
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'closed', 'transferred'],
    default: 'waiting'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [{
    type: String,
    trim: true
  }],
  subject: {
    type: String,
    trim: true
  },
  lastMessage: {
    type: String
  },
  lastMessageTime: {
    type: Date
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    ratedAt: Date
  },
  transferHistory: [{
    fromAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    toAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reason: String,
    transferredAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    userAgent: String,
    ip: String,
    currentPage: String,
    referrer: String,
    location: {
      country: String,
      city: String
    }
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// ایندکس‌ها برای جستجوی سریعتر
chatSchema.index({ siteId: 1, status: 1 });
chatSchema.index({ adminId: 1, status: 1 });
chatSchema.index({ createdAt: -1 });

// بروزرسانی updatedAt
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Chat', chatSchema);