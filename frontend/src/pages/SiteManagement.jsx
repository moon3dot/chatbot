import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteStore } from '../store/siteStore';
import { siteAPI } from '../utils/api';
import toast from 'react-hot-toast';
import {
  Globe,
  Plus,
  Edit,
  Trash2,
  Copy,
  Code,
  Users,
  Loader,
  X,
  CheckCircle,
} from 'lucide-react';

const SiteManagement = () => {
  const navigate = useNavigate();
  const { sites, setSites, addSite, removeSite, updateSite } = useSiteStore();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [formData, setFormData] = useState({
    siteName: '',
    siteUrl: '',
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const response = await siteAPI.getAll();
      setSites(response.data.data || []);
    } catch (error) {
      toast.error('خطا در دریافت سایت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.siteName || !formData.siteUrl) {
      toast.error('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    try {
      if (selectedSite) {
        // ویرایش
        const response = await siteAPI.update(selectedSite._id, formData);
        updateSite(selectedSite._id, response.data.data);
        toast.success('سایت با موفقیت بروزرسانی شد');
      } else {
        // ایجاد جدید
        const response = await siteAPI.create(formData);
        addSite(response.data.data);
        toast.success('سایت با موفقیت ایجاد شد');
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'خطا در عملیات');
    }
  };

  const handleDelete = async (siteId) => {
    if (!confirm('آیا از حذف این سایت اطمینان دارید؟')) return;

    try {
      await siteAPI.delete(siteId);
      removeSite(siteId);
      toast.success('سایت با موفقیت حذف شد');
    } catch (error) {
      toast.error('خطا در حذف سایت');
    }
  };

  const openModal = (site = null) => {
    setSelectedSite(site);
    setFormData({
      siteName: site?.siteName || '',
      siteUrl: site?.siteUrl || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSite(null);
    setFormData({ siteName: '', siteUrl: '' });
  };

  const openScriptModal = (site) => {
    setSelectedSite(site);
    setShowScriptModal(true);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} کپی شد`);
  };

  const generateUserScript = (token) => {
    return `<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = 'http://localhost:3000/widget/user?token=${token}';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:350px;height:500px;border:none;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:12px;';
  document.body.appendChild(iframe);
})();
</script>`;
  };

  const generateAdminScript = (token) => {
    return `<script>
(function() {
  var iframe = document.createElement('iframe');
  iframe.src = 'http://localhost:3000/widget/admin?token=${token}';
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);border-radius:12px;';
  document.body.appendChild(iframe);
})();
</script>`;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مدیریت سایت‌ها</h1>
          <p className="text-gray-600 mt-1">
            سایت‌های خود را مدیریت کنید و اسکریپت‌ها را دریافت کنید
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span>افزودن سایت جدید</span>
        </button>
      </div>

      {/* Sites List */}
      {sites.length === 0 ? (
        <div className="card text-center py-12">
          <Globe className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            هنوز سایتی ثبت نکرده‌اید
          </h3>
          <p className="text-gray-600 mb-4">
            برای شروع، اولین سایت خود را اضافه کنید
          </p>
          <button
            onClick={() => openModal()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            <span>افزودن سایت</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Globe className="text-primary-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{site.siteName}</h3>
                    <p className="text-sm text-gray-600">{site.siteUrl}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    site.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {site.status === 'active' ? 'فعال' : 'غیرفعال'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Code size={16} />
                  <span>توکن: {site.token.substring(0, 12)}...</span>
                  <button
                    onClick={() => copyToClipboard(site.token, 'توکن')}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/sites/${site._id}/admins`)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                >
                  <Users size={16} />
                  <span>ادمین‌ها</span>
                </button>
                <button
                  onClick={() => openScriptModal(site)}
                  className="flex-1 btn-primary text-sm flex items-center justify-center gap-1"
                >
                  <Code size={16} />
                  <span>اسکریپت‌ها</span>
                </button>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => openModal(site)}
                  className="flex-1 text-blue-600 hover:bg-blue-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Edit size={16} />
                  <span>ویرایش</span>
                </button>
                <button
                  onClick={() => handleDelete(site._id)}
                  className="flex-1 text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 size={16} />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedSite ? 'ویرایش سایت' : 'افزودن سایت جدید'}
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
                  نام سایت
                </label>
                <input
                  type="text"
                  value={formData.siteName}
                  onChange={(e) =>
                    setFormData({ ...formData, siteName: e.target.value })
                  }
                  className="input-field"
                  placeholder="مثال: فروشگاه من"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  آدرس سایت
                </label>
                <input
                  type="url"
                  value={formData.siteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, siteUrl: e.target.value })
                  }
                  className="input-field"
                  placeholder="https://example.com"
                />
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
                  {selectedSite ? 'بروزرسانی' : 'ایجاد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Script Modal */}
      {showScriptModal && selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                اسکریپت‌های {selectedSite.siteName}
              </h2>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Script */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    اسکریپت ویجت کاربر
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        generateUserScript(selectedSite.token),
                        'اسکریپت کاربر'
                      )
                    }
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                  >
                    <Copy size={16} />
                    <span>کپی</span>
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                  {generateUserScript(selectedSite.token)}
                </pre>
                <p className="text-sm text-gray-600 mt-2">
                  این کد را در صفحات سایت خود قرار دهید تا ویجت چت نمایش داده شود
                </p>
              </div>

              {/* Admin Script */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">
                    اسکریپت ویجت ادمین
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        generateAdminScript(selectedSite.token),
                        'اسکریپت ادمین'
                      )
                    }
                    className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm"
                  >
                    <Copy size={16} />
                    <span>کپی</span>
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                  {generateAdminScript(selectedSite.token)}
                </pre>
                <p className="text-sm text-gray-600 mt-2">
                  این کد را فقط در پنل ادمین سایت خود قرار دهید
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowScriptModal(false)}
                className="w-full btn-secondary"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteManagement;