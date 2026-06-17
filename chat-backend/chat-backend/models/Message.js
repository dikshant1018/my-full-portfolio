// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true
  },
  room: {
    type: String, default: 'general',
    enum: ['general','dev','random']
  },
  text:      { type: String, required: true, maxlength: 2000 },
  edited:    { type: Boolean, default: false },
  deleted:   { type: Boolean, default: false },
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message', default: null
  },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
