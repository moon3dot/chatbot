const mongoose = require('mongoose');
const crypto = require('crypto');

const siteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  siteName: {
    type: String,
    required: [true, 'نام سایت الزامی است'],
    trim: true
  },
  siteUrl: {
    type: String,
    required: [true, 'آدرس سایت الزامی است'],
    trim: true
  },
  token: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  settings: {
    welcomeMessage: {
      type: String,
      default: 'سلام! چطور می‌تونم کمکتون کنم؟'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    autoCloseChat: {
      enabled: Boolean,
      timeout: {
        type: Number,
        default: 300000 // 5 دقیقه
      }
    },
    workingHours: {
      enabled: Boolean,
      schedule: {
        saturday: { start: '09:00', end: '17:00', active: true },
        sunday: { start: '09:00', end: '17:00', active: true },
        monday: { start: '09:00', end: '17:00', active: true },
        tuesday: { start: '09:00', end: '17:00', active: true },
        wednesday: { start: '09:00', end: '17:00', active: true },
        thursday: { start: '09:00', end: '17:00', active: true },
        friday: { start: '09:00', end: '17:00', active: false }
      }
    },
    allowAnonymousChat: {
      type: Boolean,
      default: true
    },
    requireEmail: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// تولید توکن منحصر به فرد قبل از ذخیره
siteSchema.pre('save', function(next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Site', siteSchema);