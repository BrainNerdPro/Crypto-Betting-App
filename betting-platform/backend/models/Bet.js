// models/Bet.js
const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  username: { type: String, required: true },
  choice: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  line_id: { type: String, required: true }
});

module.exports = mongoose.model('Bet', betSchema);
