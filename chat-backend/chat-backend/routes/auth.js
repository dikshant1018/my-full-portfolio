// routes/auth.js
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const auth   = require('../middleware/auth');

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── REGISTER ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });
    if (existing)
      return res.status(409).json({
        error: existing.email === email.toLowerCase()
          ? 'Email already registered'
          : 'Username taken'
      });

    // Assign a colour index as avatar
    const colours = ['#7c6dfa','#34d399','#60a5fa','#fb923c','#f472b6','#fbbf24','#a78bfa','#2dd4bf'];
    const count   = await User.countDocuments();
    const avatar  = colours[count % colours.length];

    const user  = await User.create({ username, email, password, avatar });
    const token = sign(user._id);
    res.status(201).json({ token, user: user.toSafe() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign(user._id);
    res.json({ token, user: user.toSafe() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ME (verify token) ─────────────────────────────────
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user.toSafe() });
});

module.exports = router;
