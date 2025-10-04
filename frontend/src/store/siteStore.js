import { create } from 'zustand';

export const useSiteStore = create((set) => ({
  sites: [],
  currentSite: null,
  loading: false,

  // تنظیم لیست سایت‌ها
  setSites: (sites) => set({ sites }),

  // افزودن سایت جدید
  addSite: (site) =>
    set((state) => ({
      sites: [...state.sites, site],
    })),

  // بروزرسانی سایت
  updateSite: (siteId, updatedData) =>
    set((state) => ({
      sites: state.sites.map((site) =>
        site._id === siteId ? { ...site, ...updatedData } : site
      ),
    })),

  // حذف سایت
  removeSite: (siteId) =>
    set((state) => ({
      sites: state.sites.filter((site) => site._id !== siteId),
    })),

  // تنظیم سایت فعلی
  setCurrentSite: (site) => set({ currentSite: site }),

  // تنظیم وضعیت لودینگ
  setLoading: (loading) => set({ loading }),
}));