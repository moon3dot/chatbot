const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  username: {
    type: String,
    required: [true, 'نام کاربری الزامی است'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'رمز عبور الزامی است'],
    minlength: [6, 'رمز عبور باید حداقل 6 کاراکتر باشد'],
    select: false
  },
  fullName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'support'],
    default: 'admin'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'busy', 'away'],
    default: 'offline'
  },
  permissions: {
    canTransferChat: { type: Boolean, default: true },
    canViewAllChats: { type: Boolean, default: false },
    canManageAdmins: { type: Boolean, default: false },
    canAccessReports: { type: Boolean, default: false },
    canSendVoice: { type: Boolean, default: true },
    canSendFiles: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ایندکس ترکیبی برای جلوگیری از تکرار username در یک سایت
adminSchema.index({ siteId: 1, username: 1 }, { unique: true });

// رمزنگاری پسورد
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// متد مقایسه پسورد
adminSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);