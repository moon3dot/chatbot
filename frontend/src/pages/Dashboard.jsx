import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSiteStore } from '../store/siteStore';
import { siteAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Globe,
  MessageSquare,
  Users,
  TrendingUp,
  Plus,
  ArrowLeft,
  Loader,
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sites, setSites } = useSiteStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSites: 0,
    totalChats: 0,
    activeChats: 0,
    totalAdmins: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await siteAPI.getAll();
      const sitesData = response.data.data || [];
      setSites(sitesData);

      // محاسبه آمار
      setStats({
        totalSites: sitesData.length,
        totalChats: 0, // این از API دیگری میاد
        activeChats: 0,
        totalAdmins: 0,
      });
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'تعداد سایت‌ها',
      value: stats.totalSites,
      icon: Globe,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'کل گفتگوها',
      value: stats.totalChats,
      icon: MessageSquare,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'گفتگوهای فعال',
      value: stats.activeChats,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'تعداد ادمین‌ها',
      value: stats.totalAdmins,
      icon: Users,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">داشبورد</h1>
          <p className="text-gray-600 mt-1">
            خوش آمدید {user?.fullName || user?.email} عزیز
          </p>
        </div>
        <button
          onClick={() => navigate('/sites')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>افزودن سایت جدید</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-full`}>
                  <Icon className={`${stat.color.replace('bg-', 'text-')}`} size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Sites */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">سایت‌های اخیر</h2>
          <button
            onClick={() => navigate('/sites')}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
          >
            <span>مشاهده همه</span>
            <ArrowLeft size={16} />
          </button>
        </div>

        {sites.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              هنوز سایتی ثبت نکرده‌اید
            </h3>
            <p className="text-gray-600 mb-4">
              برای شروع، اولین سایت خود را اضافه کنید
            </p>
            <button
              onClick={() => navigate('/sites')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              <span>افزودن سایت</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.slice(0, 5).map((site) => (
              <div
                key={site._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/sites/${site._id}/admins`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Globe className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {site.siteName}
                    </h3>
                    <p className="text-sm text-gray-600">{site.siteUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      site.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {site.status === 'active' ? 'فعال' : 'غیرفعال'}
                  </span>
                  <ArrowLeft className="text-gray-400" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/sites')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">مدیریت سایت‌ها</h3>
              <p className="text-sm text-gray-600">افزودن و ویرایش سایت‌ها</p>
            </div>
          </div>
        </div>

        <div
          className="card hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/reports')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">گزارش‌ها</h3>
              <p className="text-sm text-gray-600">مشاهده آمار و گزارش‌ها</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow cursor-pointer opacity-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">مدیریت ادمین‌ها</h3>
              <p className="text-sm text-gray-600">افزودن و ویرایش ادمین‌ها</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;