import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Loader } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { token, user } = response.data.data;
      
      login(user, token);
      toast.success('ورود موفقیت‌آمیز!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'خطا در ورود';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ورود به سیستم
            </h1>
            <p className="text-gray-600">
              به سیستم چت آنلاین خوش آمدید
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ایمیل
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور
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
                  placeholder="••••••••"
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
                  <span>در حال ورود...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>ورود</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              حساب کاربری ندارید؟{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ثبت‌نام کنید
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

export default Login;