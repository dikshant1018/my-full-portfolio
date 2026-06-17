# 💬 Portfolio Chat Backend — Setup Guide

Real-time community chat using **Node.js + Express + Socket.io + MongoDB Atlas (free)**

---

## 📦 Stack
| Layer | Tech |
|---|---|
| Server | Node.js + Express |
| Real-time | Socket.io |
| Database | MongoDB Atlas (free M0 tier) |
| Auth | JWT + bcrypt |
| ORM | Mongoose |

---

## Step 1 — Get a free MongoDB Atlas database

1. Go to **https://cloud.mongodb.com** → Sign Up (free)
2. Create a **free M0 cluster** (any region)
3. Under **Database Access** → Add a user with password
4. Under **Network Access** → Add IP `0.0.0.0/0` (allow all, simplest for dev)
5. Click **Connect → Drivers** → copy the connection string, it looks like:
   ```
   mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/
   ```

---

## Step 2 — Configure environment

```bash
cd chat-backend
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/portfolio_chat?retryWrites=true&w=majority
JWT_SECRET=pick_any_long_random_string_here_abc123xyz
PORT=3001
CLIENT_ORIGIN=http://localhost:3000,https://yourdomain.com
```

---

## Step 3 — Install & run

```bash
cd chat-backend
npm install
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on http://localhost:3001
```

---

## Step 4 — Update the frontend

Open `portfolio_enhanced.html` and find this line (~line 1500):
```js
var CHAT_SERVER_URL = 'http://localhost:3001';
```

Change it to wherever you deployed the backend, e.g.:
```js
var CHAT_SERVER_URL = 'https://your-app.onrender.com';
```

---

## 🚀 Free Deployment Options for the Backend

### Option A — Render.com (recommended, free tier)
1. Push `chat-backend/` to a GitHub repo
2. Go to **https://render.com** → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables in the Render dashboard
6. Copy your Render URL into `CHAT_SERVER_URL` in the HTML

### Option B — Railway.app
1. `npm install -g @railway/cli`
2. `railway login && railway init && railway up`
3. Set env vars in Railway dashboard

### Option C — Fly.io
1. `npm install -g flyctl && fly launch`

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Verify token |
| GET | `/api/messages/:room` | JWT | Get last 60 messages |
| DELETE | `/api/messages/:id` | JWT | Delete own message |
| GET | `/health` | No | Server health check |

**Rooms:** `general`, `dev`, `random`

## Socket.io Events

| Event | Direction | Payload |
|---|---|---|
| `join_room` | Client→Server | `"general"` |
| `send_message` | Client→Server | `{ text, replyTo? }` |
| `typing_start` | Client→Server | — |
| `typing_stop` | Client→Server | — |
| `react` | Client→Server | `{ messageId, emoji }` |
| `delete_message` | Client→Server | `{ messageId }` |
| `new_message` | Server→Client | message object |
| `online_users` | Server→Client | `[{_id, username, avatar}]` |
| `user_typing` | Server→Client | `{ username, typing }` |
| `system_msg` | Server→Client | `{ text, at }` |
| `reactions_update` | Server→Client | `{ messageId, reactions }` |
| `message_deleted` | Server→Client | `{ messageId }` |

---

## Features implemented

- ✅ Register / Login with JWT auth
- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ 3 chat rooms: #general, #dev, #random
- ✅ Real-time messaging via Socket.io
- ✅ Message history (last 60 per room) from MongoDB
- ✅ Online users list per room
- ✅ Typing indicators
- ✅ Emoji reactions (👍❤️😂🔥👀🎉)
- ✅ Reply to message (with quote preview)
- ✅ Delete own messages
- ✅ Join/leave system messages
- ✅ Auto-reconnect on page load (JWT in localStorage)
- ✅ Color-coded user avatars
- ✅ Responsive layout (mobile-friendly)
