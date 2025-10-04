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
      enabled: { type: Boolean, default: false },
      timeout: {
        type: Number,
        default: 300000 // 5 دقیقه
      }
    },
    workingHours: {
      enabled: { type: Boolean, default: false },
      schedule: {
        saturday: { 
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
          active: { type: Boolean, default: true }
        },
        sunday: { 
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
          active: { type: Boolean, default: true }
        },
        monday: { 
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
          active: { type: Boolean, default: true }
        },
        tuesday: { 
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
          active: { type: Boolean, default: true }
        },
        wednesday: { 
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
          active: { type: Boolean, default: true }
        },
        thursday: { 
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
          active: { type: Boolean, default: true }
        },
        friday: { 
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
          active: { type: Boolean, default: false }
        }
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