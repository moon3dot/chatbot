import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, UserPlus, Loader } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // اعتبارسنجی
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error('لطفاً فیلدهای الزامی را پر کنید');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('رمز عبور باید حداقل 6 کاراکتر باشد');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...dataToSend } = formData;
      const response = await authAPI.register(dataToSend);
      const { token, user } = response.data.data;

      login(user, token);
      toast.success('ثبت‌نام با موفقیت انجام شد!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'خطا در ثبت‌نام';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ثبت‌نام
            </h1>
            <p className="text-gray-600">
              حساب کاربری جدید ایجاد کنید
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام و نام خانوادگی <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <User className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="نام کامل خود را وارد کنید"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="example@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره تماس
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Phone className="text-gray-400" size={20} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="09123456789"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="حداقل 6 کاراکتر"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تکرار رمز عبور <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="رمز عبور را دوباره وارد کنید"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  <span>در حال ثبت‌نام...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>ثبت‌نام</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              قبلاً ثبت‌نام کرده‌اید؟{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                وارد شوید
              </Link>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          © 2024 سیستم چت آنلاین. تمامی حقوق محفوظ است.
        </p>
      </div>
    </div>
  );
};

export default Register;