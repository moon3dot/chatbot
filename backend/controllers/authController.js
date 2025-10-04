const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    ثبت‌نام کاربر جدید
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone } = req.body;

    // بررسی وجود کاربر
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'این ایمیل قبلاً ثبت شده است'
      });
    }

    // ایجاد کاربر جدید
    const user = await User.create({
      email,
      password,
      fullName,
      phone
    });

    // تولید توکن
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'ثبت‌نام با موفقیت انجام شد',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    ورود کاربر
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // اعتبارسنجی
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'لطفاً ایمیل و رمز عبور را وارد کنید'
      });
    }

    // بررسی وجود کاربر
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ایمیل یا رمز عبور اشتباه است'
      });
    }

    // بررسی رمز عبور
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'ایمیل یا رمز عبور اشتباه است'
      });
    }

    // بروزرسانی زمان آخرین ورود
    user.lastLogin = Date.now();
    await user.save();

    // تولید توکن
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'ورود موفقیت‌آمیز',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    دریافت اطلاعات کاربر فعلی
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          status: user.status,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};