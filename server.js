const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('یک کاربر متصل شد ✅');

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // پیام برای همه ارسال میشه
  });

  socket.on('disconnect', () => {
    console.log('کاربر قطع شد ❌');
  });
});

server.listen(3000, () => {
  console.log('🚀 سرور روی http://localhost:3000 اجرا شد');
});
