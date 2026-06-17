// socket/chat.js
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Message = require('../models/Message');

// Track online users per room: { socketId -> { userId, username, avatar, room } }
const connected = new Map();

function getOnlineInRoom(room) {
  const users = [];
  for (const [, info] of connected) {
    if (info.room === room) users.push({ _id: info.userId, username: info.username, avatar: info.avatar });
  }
  return users;
}

module.exports = function initSocket(io) {

  // ── Auth handshake ──────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(payload.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    let currentRoom = 'general';

    // Mark online
    await User.findByIdAndUpdate(user._id, { online: true });

    // ── JOIN ROOM ──────────────────────────────────────
    socket.on('join_room', async (room) => {
      const allowed = ['general','dev','random'];
      if (!allowed.includes(room)) room = 'general';

      // Leave previous
      if (currentRoom) {
        socket.leave(currentRoom);
        connected.delete(socket.id);
        io.to(currentRoom).emit('online_users', getOnlineInRoom(currentRoom));
      }

      currentRoom = room;
      socket.join(room);
      connected.set(socket.id, {
        userId: user._id.toString(),
        username: user.username,
        avatar:   user.avatar,
        room
      });

      // Send online list to room
      io.to(room).emit('online_users', getOnlineInRoom(room));

      // Confirm join to this socket
      socket.emit('room_joined', { room });

      // Broadcast join notice
      socket.to(room).emit('system_msg', {
        text: `${user.username} joined #${room}`,
        at:   new Date()
      });
    });

    // ── SEND MESSAGE ───────────────────────────────────
    socket.on('send_message', async ({ text, replyTo }) => {
      if (!text || !text.trim()) return;
      const clean = text.trim().slice(0, 2000);

      try {
        const msg = await Message.create({
          sender: user._id,
          room:   currentRoom,
          text:   clean,
          replyTo: replyTo || null
        });

        const populated = await msg.populate([
          { path: 'sender', select: 'username avatar' },
          { path: 'replyTo', select: 'text sender', populate: { path: 'sender', select: 'username' } }
        ]);

        io.to(currentRoom).emit('new_message', populated);
      } catch (err) {
        socket.emit('error_msg', { error: err.message });
      }
    });

    // ── TYPING INDICATOR ──────────────────────────────
    socket.on('typing_start', () => {
      socket.to(currentRoom).emit('user_typing', { username: user.username, typing: true });
    });
    socket.on('typing_stop', () => {
      socket.to(currentRoom).emit('user_typing', { username: user.username, typing: false });
    });

    // ── REACT TO MESSAGE ──────────────────────────────
    socket.on('react', async ({ messageId, emoji }) => {
      const allowed = ['👍','❤️','😂','🔥','👀','🎉'];
      if (!allowed.includes(emoji)) return;
      try {
        const msg  = await Message.findById(messageId);
        if (!msg || msg.room !== currentRoom) return;

        const slot = msg.reactions.find(r => r.emoji === emoji);
        const uid  = user._id.toString();

        if (slot) {
          const idx = slot.users.map(u => u.toString()).indexOf(uid);
          idx === -1 ? slot.users.push(user._id) : slot.users.splice(idx, 1);
          if (slot.users.length === 0) msg.reactions = msg.reactions.filter(r => r.emoji !== emoji);
        } else {
          msg.reactions.push({ emoji, users: [user._id] });
        }

        await msg.save();
        io.to(currentRoom).emit('reactions_update', {
          messageId,
          reactions: msg.reactions.map(r => ({ emoji: r.emoji, count: r.users.length, mine: r.users.map(u=>u.toString()).includes(uid) }))
        });
      } catch {}
    });

    // ── DELETE MESSAGE ─────────────────────────────────
    socket.on('delete_message', async ({ messageId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg || msg.room !== currentRoom) return;
        if (msg.sender.toString() !== user._id.toString() && user.role !== 'admin') return;
        msg.deleted = true;
        await msg.save();
        io.to(currentRoom).emit('message_deleted', { messageId });
      } catch {}
    });

    // ── DISCONNECT ─────────────────────────────────────
    socket.on('disconnect', async () => {
      connected.delete(socket.id);
      await User.findByIdAndUpdate(user._id, { online: false, lastSeen: new Date() });
      io.to(currentRoom).emit('online_users', getOnlineInRoom(currentRoom));
      socket.to(currentRoom).emit('system_msg', {
        text: `${user.username} left`,
        at:   new Date()
      });
    });
  });
};
