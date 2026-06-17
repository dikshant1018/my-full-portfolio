// routes/messages.js
const router  = require('express').Router();
const Message = require('../models/Message');
const auth    = require('../middleware/auth');

// ── GET history for a room (last 60 messages) ─────────
router.get('/:room', auth, async (req, res) => {
  try {
    const { room } = req.params;
    const allowed  = ['general','dev','random'];
    if (!allowed.includes(room))
      return res.status(400).json({ error: 'Unknown room' });

    const messages = await Message.find({ room, deleted: false })
      .sort({ createdAt: -1 })
      .limit(60)
      .populate('sender', 'username avatar')
      .populate('replyTo', 'text sender')
      .lean();

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE own message ────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Not found' });
    if (msg.sender.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });

    msg.deleted = true;
    await msg.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
