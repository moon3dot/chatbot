# 💬 سیستم چت آنلاین جامع - Backend

یک سیستم چت حرفه‌ای و کامل با قابلیت مدیریت چند سایت، ادمین‌های متعدد و گزارش‌دهی پیشرفته.

## 🚀 ویژگی‌های فاز 1 (فعلی)

- ✅ سیستم احراز هویت کامل (ثبت‌نام/ورود)
- ✅ مدیریت کاربران (صاحبان سایت)
- ✅ مدل‌های دیتابیس پیشرفته
- ✅ امنیت با JWT
- ✅ رمزنگاری پسورد با bcrypt
- ✅ Error Handling حرفه‌ای
- ✅ Socket.IO برای Real-time chat

## 📦 تکنولوژی‌ها

- **Node.js** v18+
- **Express.js** - فریمورک وب
- **MongoDB** - دیتابیس
- **Mongoose** - ODM برای MongoDB
- **Socket.IO** - ارتباط Real-time
- **JWT** - احراز هویت
- **bcryptjs** - رمزنگاری

## ⚙️ نصب و راه‌اندازی

### پیش‌نیازها
- Node.js نسخه 18 یا بالاتر
- MongoDB نسخه 6 یا بالاتر
- npm یا yarn

### مراحل نصب
```bash
# 1. کلون کردن پروژه
git clone https://github.com/YOUR_USERNAME/chat-system-backend.git
cd chat-system-backend

# 2. نصب پکیج‌ها
npm install

# 3. تنظیم متغیرهای محیطی
cp .env.example .env
# سپس فایل .env را ویرایش کنید

# 4. اجرای سرور (Development)
npm run dev

# یا اجرای سرور (Production)
npm start