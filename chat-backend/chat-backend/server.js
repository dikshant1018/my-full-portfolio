// server.js
require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server} = require('socket.io');
const mongoose  = require('mongoose');
const cors      = require('cors');

const authRoutes = require('./routes/auth');
const msgRoutes  = require('./routes/messages');
const initSocket = require('./socket/chat');

const app    = express();
const server = http.createServer(app);

// ── CORS ────────────────────────────────────────────────
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim());

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());

// ── SOCKET.IO ───────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: origins, methods: ['GET','POST'], credentials: true }
});
initSocket(io);

// ── REST ROUTES ─────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/messages', msgRoutes);

app.get('/health', (_, res) => res.json({ ok: true, time: new Date() }));

// ── MONGO + START ────────────────────────────────────────
const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
