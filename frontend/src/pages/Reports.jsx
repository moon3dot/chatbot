import React, { useState, useEffect } from 'react';
import { useSiteStore } from '../store/siteStore';
import { siteAPI, reportAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Download,
  Calendar,
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  Star,
  Loader,
  FileSpreadsheet,
} from 'lucide-react';

const Reports = () => {
  const { sites, setSites } = useSiteStore();
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    closedChats: 0,
    averageResponseTime: 0,
    satisfactionRate: 0,
    totalAdmins: 0,
  });
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchReports();
    }
  }, [selectedSite, dateRange]);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await siteAPI.getAll();
      const sitesData = response.data.data || [];
      setSites(sitesData);
      if (sitesData.length > 0) {
        setSelectedSite(sitesData[0]._id);
      }
    } catch (error) {
      toast.error('خطا در دریافت سایت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await reportAPI.getOverview(selectedSite);
      setStats(response.data.data || {});
    } catch (error) {
      toast.error('خطا در دریافت گزارش‌ها');
    }
  };

  const handleExportEmails = async () => {
    try {
      const response = await reportAPI.exportEmails(selectedSite);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emails_${new Date().getTime()}.xlsx`;
      a.click();
      toast.success('فایل ایمیل‌ها دانلود شد');
    } catch (error) {
      toast.error('خطا در دانلود فایل');
    }
  };

  const handleExportPhones = async () => {
    try {
      const response = await reportAPI.exportPhones(selectedSite);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phones_${new Date().getTime()}.xlsx`;
      a.click();
      toast.success('فایل شماره تماس‌ها دانلود شد');
    } catch (error) {
      toast.error('خطا در دانلود فایل');
    }
  };

  const statCards = [
    {
      title: 'کل گفتگوها',
      value: stats.totalChats || 0,
      icon: MessageSquare,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'گفتگوهای فعال',
      value: stats.activeChats || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'گفتگوهای بسته شده',
      value: stats.closedChats || 0,
      icon: MessageSquare,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'میانگین زمان پاسخ',
      value: `${stats.averageResponseTime || 0} ثانیه`,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'رضایت کاربران',
      value: `${stats.satisfactionRate || 0}%`,
      icon: Star,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'تعداد ادمین‌ها',
      value: stats.totalAdmins || 0,
      icon: Users,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="card text-center py-12">
        <BarChart3 className="mx-auto text-gray-400 mb-4" size={64} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          هنوز سایتی ثبت نکرده‌اید
        </h3>
        <p className="text-gray-600">
          برای مشاهده گزارش‌ها ابتدا یک سایت اضافه کنید
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">گزارش‌ها و آمار</h1>
        <p className="text-gray-600 mt-1">
          بررسی عملکرد و آمار گفتگوها
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Site Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              انتخاب سایت
            </label>
            <select
              value={selectedSite || ''}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="input-field"
            >
              {sites.map((site) => (
                <option key={site._id} value={site._id}>
                  {site.siteName}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              از تاریخ
            </label>
            <div className="relative">
              <Calendar
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
                className="input-field pr-10"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تا تاریخ
            </label>
            <div className="relative">
              <Calendar
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
                className="input-field pr-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-4 rounded-full`}>
                  <Icon
                    className={`${stat.color.replace('bg-', 'text-')}`}
                    size={28}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          خروجی اطلاعات
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportEmails}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <FileSpreadsheet size={20} />
            <span>دانلود لیست ایمیل‌ها</span>
          </button>
          <button
            onClick={handleExportPhones}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <FileSpreadsheet size={20} />
            <span>دانلود لیست شماره تماس‌ها</span>
          </button>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          نمودار گفتگوها
        </h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <BarChart3 className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600">
            نمودار آماری به زودی اضافه خواهد شد
          </p>
        </div>
      </div>

      {/* Admin Performance */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          عملکرد ادمین‌ها
        </h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Users className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600">
            گزارش عملکرد ادمین‌ها به زودی اضافه خواهد شد
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;