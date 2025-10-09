import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, LogIn, Loader } from 'lucide-react';
import { adminAPI } from '../utils/api';
import { useAdminAuthStore } from '../store/adminAuthStore';

const AdminWidget = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const siteToken = searchParams.get('token');

  const isAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const admin = useAdminAuthStore((state) => state.admin);
  const loginAdmin = useAdminAuthStore((state) => state.login);
  const logoutAdmin = useAdminAuthStore((state) => state.logout);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && admin?.siteId) {
      navigate(`/widget/admin/panel/${admin.siteId}`, { replace: true });
    }
  }, [isAuthenticated, admin, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!siteToken) {
      toast.error('توکن سایت در URL یافت نشد');
      return;
    }

    if (!formData.username || !formData.password) {
      toast.error('لطفاً نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    try {
      setLoading(true);
      const response = await adminAPI.login({
        siteToken,
        token: siteToken,
        username: formData.username,
        password: formData.password,
      });

      const { token, admin: adminData } = response.data.data;
      loginAdmin(adminData, token);
      toast.success('ورود با موفقیت انجام شد');
      navigate(`/widget/admin/panel/${adminData.siteId}`, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || 'خطا در ورود ادمین';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!siteToken && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <Shield className="mx-auto text-red-500" size={48} />
          <h1 className="text-2xl font-bold text-gray-900">توکن سایت یافت نشد</h1>
          <p className="text-gray-600">
            لطفاً با مدیر سیستم تماس بگیرید تا لینک صحیح به شما داده شود.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="text-primary-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ورود ادمین</h1>
            <p className="text-gray-600">
              برای دسترسی به پنل پشتیبانی، اطلاعات ورود خود را وارد کنید
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام کاربری
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field"
                placeholder="نام کاربری"
                autoComplete="username"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رمز عبور
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="رمز عبور"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

          {isAuthenticated && (
            <button
              onClick={logoutAdmin}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              خروج از حساب کاربری
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWidget;
