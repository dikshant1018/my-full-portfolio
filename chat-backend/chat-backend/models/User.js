// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true,
    trim: true, minlength: 2, maxlength: 24,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true
  },
  password:  { type: String, required: true, minlength: 6 },
  avatar:    { type: String, default: '' },   // initials colour stored here
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  online:    { type: Boolean, default: false },
  lastSeen:  { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafe = function() {
  return {
    _id:      this._id,
    username: this.username,
    email:    this.email,
    avatar:   this.avatar,
    role:     this.role,
    online:   this.online,
    lastSeen: this.lastSeen,
    createdAt:this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
