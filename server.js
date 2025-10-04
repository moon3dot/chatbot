require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./backend/config/database');
const errorHandler = require('./backend/middleware/errorHandler');
const chatHandler = require('./backend/socket/chatHandler');

// اتصال به دیتابیس
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/sites', require('./backend/routes/sites'));
app.use('/api/admin', require('./backend/routes/admin'));
app.use('/api', require('./backend/routes/chat'));
app.use('/api', require('./backend/routes/reports'));

// Route اصلی
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ سرور چت سیستم در حال اجرا است',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      sites: '/api/sites',
      admins: '/api/admin & /api/sites/:siteId/admins',
      chats: '/api/chats & /api/sites/:siteId/chats',
      reports: '/api/sites/:siteId/reports'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'مسیر مورد نظر یافت نشد'
  });
});

// Error Handler
app.use(errorHandler);

// Socket.IO Handler
chatHandler(io);

// اضافه کردن io به app برای استفاده در controller‌ها
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 سرور در حال اجرا روی پورت ${PORT}`);
  console.log(`📝 محیط: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 آدرس: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO آماده است`);
  console.log(`${'='.repeat(50)}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});