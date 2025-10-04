import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, siteAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  ArrowRight,
  Loader,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

const AdminManagement = () => {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'admin',
  });

  useEffect(() => {
    fetchData();
  }, [siteId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [siteResponse, adminsResponse] = await Promise.all([
        siteAPI.getById(siteId),
        adminAPI.getAll(siteId),
      ]);
      setSite(siteResponse.data.data);
      setAdmins(adminsResponse.data.data || []);
    } catch (error) {
      toast.error('خطا در دریافت اطلاعات');
      navigate('/sites');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.fullName) {
      toast.error('لطفاً فیلدهای الزامی را پر کنید');
      return;
    }

    try {
      if (selectedAdmin) {
        // ویرایش
        const response = await adminAPI.update(
          siteId,
          selectedAdmin._id,
          formData
        );
        setAdmins(
          admins.map((admin) =>
            admin._id === selectedAdmin._id ? response.data.data : admin
          )
        );
        toast.success('ادمین با موفقیت بروزرسانی شد');
      } else {
        // ایجاد جدید
        const response = await adminAPI.create(siteId, formData);
        setAdmins([...admins, response.data.data]);
        toast.success('ادمین با موفقیت ایجاد شد');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در عملیات');
    }
  };

  const handleDelete = async (adminId) => {
    if (!confirm('آیا از حذف این ادمین اطمینان دارید؟')) return;

    try {
      await adminAPI.delete(siteId, adminId);
      setAdmins(admins.filter((admin) => admin._id !== adminId));
      toast.success('ادمین با موفقیت حذف شد');
    } catch (error) {
      toast.error('خطا در حذف ادمین');
    }
  };

  const openModal = (admin = null) => {
    setSelectedAdmin(admin);
    setFormData({
      username: admin?.username || '',
      password: '',
      fullName: admin?.fullName || '',
      email: admin?.email || '',
      role: admin?.role || 'admin',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAdmin(null);
    setShowPassword(false);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      role: 'admin',
    });
  };

  const getRoleBadge = (role) => {
    const roles = {
      super_admin: { label: 'سوپر ادمین', class: 'bg-purple-100 text-purple-700' },
      admin: { label: 'ادمین', class: 'bg-blue-100 text-blue-700' },
      support: { label: 'پشتیبان', class: 'bg-green-100 text-green-700' },
    };
    return roles[role] || roles.admin;
  };

  const getStatusIcon = (status) => {
    const statuses = {
      online: { icon: UserCheck, class: 'text-green-600' },
      offline: { icon: UserX, class: 'text-gray-400' },
      busy: { icon: UserX, class: 'text-yellow-600' },
      away: { icon: UserX, class: 'text-orange-600' },
    };
    return statuses[status] || statuses.offline;
  };

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
      <div>
        <button
          onClick={() => navigate('/sites')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowRight size={20} />
          <span>بازگشت به سایت‌ها</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              مدیریت ادمین‌ها
            </h1>
            <p className="text-gray-600 mt-1">
              سایت: {site?.siteName} ({admins.length} ادمین)
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>افزودن ادمین جدید</span>
          </button>
        </div>
      </div>

      {/* Admins List */}
      {admins.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            هنوز ادمینی ثبت نکرده‌اید
          </h3>
          <p className="text-gray-600 mb-4">
            برای شروع، اولین ادمین خود را اضافه کنید
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            <span>افزودن ادمین</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin) => {
            const StatusIcon = getStatusIcon(admin.status).icon;
            const roleBadge = getRoleBadge(admin.role);
            return (
              <div
                key={admin._id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {admin.fullName}
                      </h3>
                      <p className="text-sm text-gray-600">@{admin.username}</p>
                    </div>
                  </div>
                  <StatusIcon
                    size={20}
                    className={getStatusIcon(admin.status).class}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">نقش:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge.class}`}
                    >
                      {roleBadge.label}
                    </span>
                  </div>
                  {admin.email && (
                    <div className="text-sm text-gray-600">
                      ایمیل: {admin.email}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    وضعیت:{' '}
                    {admin.status === 'online'
                      ? 'آنلاین'
                      : admin.status === 'busy'
                      ? 'مشغول'
                      : admin.status === 'away'
                      ? 'دور'
                      : 'آفلاین'}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => openModal(admin)}
                    className="flex-1 text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit size={16} />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => handleDelete(admin._id)}
                    className="flex-1 text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={16} />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedAdmin ? 'ویرایش ادمین' : 'افزودن ادمین جدید'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام کامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="input-field"
                  placeholder="نام و نام خانوادگی"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام کاربری <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="input-field"
                  placeholder="username"
                  disabled={!!selectedAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رمز عبور {!selectedAdmin && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="input-field pl-10"
                    placeholder={
                      selectedAdmin ? 'برای تغییر وارد کنید' : 'حداقل 6 کاراکتر'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ایمیل
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input-field"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نقش
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="input-field"
                >
                  <option value="support">پشتیبان</option>
                  <option value="admin">ادمین</option>
                  <option value="super_admin">سوپر ادمین</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 btn-secondary"
                >
                  انصراف
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {selectedAdmin ? 'بروزرسانی' : 'ایجاد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;