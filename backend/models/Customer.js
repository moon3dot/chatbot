const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  isRegistered: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String, // ID از سیستم خود مشتری
    trim: true
  },
  metadata: {
    userAgent: String,
    ip: String,
    location: {
      country: String,
      city: String,
      region: String
    },
    browser: String,
    os: String,
    device: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalChats: {
    type: Number,
    default: 0
  },
  lastChatAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'vip'],
    default: 'active'
  },
  blockedReason: {
    type: String
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  blockedAt: {
    type: Date
  },
  customFields: {
    type: Map,
    of: String
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

// ایندکس‌ها
customerSchema.index({ siteId: 1, email: 1 });
customerSchema.index({ siteId: 1, phone: 1 });
customerSchema.index({ siteId: 1, userId: 1 });

// بروزرسانی updatedAt
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
