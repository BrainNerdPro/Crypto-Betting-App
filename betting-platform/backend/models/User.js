// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // NEW
  balance: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  last_active: { type: Date, default: Date.now },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', userSchema);
