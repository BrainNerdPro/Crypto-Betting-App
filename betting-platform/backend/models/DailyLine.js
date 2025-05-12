const mongoose = require('mongoose');

const dailyLineSchema = new mongoose.Schema({
  _id: { type: String }, 
  question: { type: String, required: true },
  yes_odds: { type: String, required: true },
  no_odds: { type: String, required: true },
  cutoff_time: { type: Date, required: true },
  is_active: { type: Boolean, default: true },
  winning_side: { type: String, default: null },
});

module.exports = mongoose.model('DailyLine', dailyLineSchema);