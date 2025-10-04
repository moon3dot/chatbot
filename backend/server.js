require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// اتصال به دیتابیس
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Route اصلی
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ سرور چت سیستم در حال اجرا است',
    version: '1.0.0'
  });
});

// Error Handler
app.use(errorHandler);

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('🔌 کاربر جدید متصل شد:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ کاربر قطع شد:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 سرور در حال اجرا روی پورت ${PORT}`);
  console.log(`📝 محیط: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 آدرس: http://localhost:${PORT}\n`);
});